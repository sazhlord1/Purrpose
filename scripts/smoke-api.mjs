const BASE = process.env.SMOKE_BASE ?? 'http://127.0.0.1:3000/api/v1';

function assert(cond, label) {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exit(1);
  }
  console.log(`ok: ${label}`);
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

const suffix = Date.now();
let passed = 0;
function step(label) {
  passed += 1;
  console.log(`ok ${passed}: ${label}`);
}

const health = await call('GET', '/healthz');
assert(health.status === 200 && health.json.ok === true, 'healthz responds');
step('healthz');

const session = await call('POST', '/session');
assert(session.status === 200 && typeof session.json.token === 'string', 'session created');
assert(session.json.starterGrantApplied === true, 'starter grant applied once');
const token = session.json.token;
step('anonymous session');

const me = await call('GET', '/me', { token });
assert(me.status === 200, 'me authorized');
const meals = me.json.balances.find(b => b.creditType === 'MEALS');
assert(meals.amount === 10 && meals.available === 10, `starter pantry (meals=${meals.amount})`);
step('starter grant visible in wallet');

const cats = await call('GET', '/cats');
assert(cats.status === 200 && cats.json.cats.length === 5, 'five seeded cats');
step('cat catalog');

const deadline = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
const created = await call('POST', '/commitments', {
  token,
  body: {
    title: `Smoke commitment ${suffix}`,
    deadlineISO: deadline,
    catId: 'orange',
    consequenceType: 'MEALS',
    consequenceAmount: 5,
  },
});
assert(created.status === 201, 'commitment created');
const id = created.json.commitment.id;
assert(created.json.commitment.phase === 'INITIAL', 'phase starts INITIAL (deal sealed)');
step('create commitment');

const denied = await call('POST', '/commitments', {
  token,
  body: {
    title: 'Overstake',
    deadlineISO: deadline,
    catId: 'orange',
    consequenceType: 'MEALS',
    consequenceAmount: 6,
  },
});
assert(denied.status === 409 && denied.json.error.code === 'INSUFFICIENT_AVAILABLE', 'overstake blocked');
step('availability enforcement');

const done = await call('POST', `/commitments/${id}/complete`, { token });
assert(done.status === 200 && done.json.commitment.status === 'COMPLETED', 'completion wins');
const dup = await call('POST', `/commitments/${id}/complete`, { token });
assert(dup.status === 409 && dup.json.error.code === 'ALREADY_SETTLED', 'duplicate complete rejected');
step('idempotent completion');

const meAfter = await call('GET', '/me', { token });
const mealsAfter = meAfter.json.balances.find(b => b.creditType === 'MEALS');
assert(mealsAfter.amount === 10 && mealsAfter.stakedActive === 0, 'stake released, balance intact');
step('economy release on success');

const history = await call('GET', '/history', { token });
assert(history.status === 200 && history.json.totals.completed >= 1, 'history shows completion');
step('impact history');

const topup = await call('POST', '/wallet/topup', { token, body: { creditType: 'MEALS', amount: 7 } });
assert(topup.status === 200 && topup.json.amount === 17, `top-up applied (amount=${topup.json?.amount})`);
const meAfterTopup = await call('GET', '/me', { token });
const mealsWallet = meAfterTopup.json.balances.find(b => b.creditType === 'MEALS');
assert(mealsWallet.available === 17 && mealsWallet.stakedActive === 0, 'available tracks balance after top-up');
step('wallet top-up');

console.log(`\nSMOKE PASS (${passed} steps)`);
