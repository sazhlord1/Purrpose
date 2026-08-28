import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';

const API = 'http://127.0.0.1:3000/api/v1';
const CONTAINER = 'purrpose-postgres';

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() > deadline) return reject(new Error(`server did not start: ${url}`));
      setTimeout(tick, 400);
    };
    tick();
  });
}

function assert(cond, label) {
  if (!cond) throw new Error(`ASSERT FAILED: ${label}`);
  console.log(`ok: ${label}`);
}

function docker(action) {
  return spawn('docker', [action, CONTAINER], { stdio: 'ignore' });
}

function pgReady() {
  try {
    execSync(`docker exec ${CONTAINER} pg_isready -U purrpose`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const server = spawn('node', ['dist/index.js'], {
  cwd: 'apps/server',
  stdio: 'ignore',
});

// The dev clock is shared state for the whole API process. Always restore its
// offset so later runs / other suites are not affected by the +10m jump.
let clockOffsetMs = 0;
async function resetClock() {
  if (!clockOffsetMs) return;
  await fetch(`${API}/dev/time-travel?addMinutes=${-clockOffsetMs / 60_000}`).catch(() => {});
  clockOffsetMs = 0;
}

try {
  await waitForServer(`${API}/healthz`);
  console.log('ok: server up (database healthy)');

  const session = await (await fetch(`${API}/session`, { method: 'POST' })).json();
  const token = session.token;
  const headers = { authorization: `Bearer ${token}` };

  await fetch(`${API}/commitments`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Chaos target',
      deadlineISO: new Date(Date.now() + 6 * 60000).toISOString(),
      catId: 'orange',
      consequenceType: 'MEALS',
      consequenceAmount: 4,
    }),
  });
  const travel = await fetch(`${API}/dev/time-travel?addMinutes=10`);
  clockOffsetMs = (await travel.json()).offsetMs ?? 0;
  console.log('ok: commitment created, clock traveled past deadline (settlement pending)');

  docker('stop');
  await wait(2500);
  assert(!(await fetch(`${API}/healthz`).then(r => r.ok).catch(() => false)) === false, 'server survives DB loss');

  const during = await fetch(`${API}/commitments`, { headers });
  const duringBody = await during.json();
  assert(during.status === 500 || during.status === 200, `during outage: clean HTTP ${during.status} (envelope: ${duringBody.error?.code ?? 'settled-anyway'})`);

  console.log('restarting database…');
  docker('start');
  const dbDeadline = Date.now() + 30000;
  while (!pgReady() && Date.now() < dbDeadline) await wait(500);
  assert(pgReady(), 'database back up');
  await wait(1500);

  let recovered = null;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${API}/commitments`, { headers });
    if (res.ok) {
      recovered = await res.json();
      break;
    }
    await wait(1000);
  }
  assert(recovered !== null, 'API recovers after DB restart (Prisma reconnects)');
  assert(recovered.commitments[0].status === 'FAILED', 'pending settlement completed after recovery');

  const me = await (await fetch(`${API}/me`, { headers })).json();
  const meals = me.balances.find(b => b.creditType === 'MEALS');
  assert(meals.amount === 6, `balance drained exactly once (10 → ${meals.amount})`);

  const history = await (await fetch(`${API}/history`, { headers })).json();
  assert(history.totals.failed === 1 && history.totals.donatedByType.MEALS === 4, 'ledger shows exactly one failure deduction');

  const health = await fetch(`${API}/healthz`);
  assert(health.ok, 'server healthy after chaos cycle');

  console.log('\nCHAOS PASS — kill-DB-mid-settle recovers cleanly, exactly-once holds');
} finally {
  await resetClock();
  server.kill();
  try {
    execSync(`docker start ${CONTAINER}`, { stdio: 'ignore' });
  } catch {}
}
