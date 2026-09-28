import { Link } from 'react-router-dom';
import { CatScene } from '@purrpose/cats';
import type { CommitmentDto, Loadout } from '@purrpose/shared';
import type { CommitmentView } from '../lib/commitmentView.js';
import { fmtRemaining } from '../lib/format.js';
import { catNameOf, moodLabel } from '../lib/labels.js';

interface CatCardProps {
  c: CommitmentDto;
  view: CommitmentView;
  hour: number;
  items?: Loadout;
}

/** Small card for one active pact on Home: static scene snapshot + stage + time left. */
export function CatCard({ c, view, hour, items }: CatCardProps) {
  const mood = moodLabel(view.pending ? undefined : view.phase);
  return (
    <Link to={`/commitment/${c.id}`} className="cat-card" aria-label={`${c.title} — ${catNameOf(c.catId)}, ${view.stage.label}`}>
      <div className="cat-card-scene">
        <CatScene catId={c.catId} state={view.sceneState} phaseRatio={view.phaseRatio} seed={view.seed} reduced hour={hour} items={items} />
      </div>
      <div className="cat-card-body">
        <strong className="cat-card-title">{c.title}</strong>
        <span className="muted cat-card-meta">
          {view.stage.icon} {catNameOf(c.catId)} · {view.pending ? 'checking…' : fmtRemaining(view.remainingMs)}
        </span>
        <span className={`stamp ${mood.hot ? 'stamp-fed' : ''}`}>{mood.short}</span>
      </div>
    </Link>
  );
}
