import { LIFE_STAGES, type LifeStageInfo } from '@purrpose/cats';
import { fmtRemaining } from '../lib/format.js';

interface StagePathProps {
  stage: LifeStageInfo;
  nextStageInMs: number | null;
  finished?: boolean;
}

/** 📦 → 🌿 → 🛋️ → 🏰 → 👑 with the current stop highlighted and a countdown to the next one. */
export function StagePath({ stage, nextStageInMs, finished = false }: StagePathProps) {
  const next = LIFE_STAGES[stage.stage] as LifeStageInfo | undefined;
  return (
    <div className="stage-path" aria-label={`Stage ${stage.stage} of 5: ${stage.label}`}>
      <ol className="stage-path-steps">
        {LIFE_STAGES.map(s => {
          const state = s.stage < stage.stage ? 'done' : s.stage === stage.stage ? 'current' : 'todo';
          return (
            <li key={s.key} className={`stage-step stage-${state}`} title={s.label}>
              <span className="stage-icon" aria-hidden>
                {s.icon}
              </span>
              <span className="stage-name">{s.label}</span>
            </li>
          );
        })}
      </ol>
      {!finished && (
        <p className="stage-path-next muted">
          {next && nextStageInMs !== null
            ? `Next: ${next.icon} ${next.label} in ${fmtRemaining(nextStageInMs)}`
            : `${stage.icon} Final stage — the feast is right there.`}
        </p>
      )}
    </div>
  );
}
