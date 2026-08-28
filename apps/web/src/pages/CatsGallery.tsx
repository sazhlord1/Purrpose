import { CAT_STATES, Cat, type CatState } from '@purrpose/cats';
import { CAT_SEED, type CatId } from '@purrpose/shared';
import { SketchCard } from '../components/ui/index.js';

const CATS: Array<{ id: CatId; name: string }> = CAT_SEED.map(c => ({
  id: c.id,
  name: c.name,
}));

export function CatsGallery() {
  return (
    <main>
      <h1>Cat Gallery</h1>
      <p className="muted">
        Static canon poses — one per emotional state. These are the reduced-motion poses and the
        animation keyframes' source of truth.
      </p>

      {CATS.map(cat => (
        <section key={cat.id} className="kit-section">
          <h2>
            {cat.name} <span className="muted">({cat.id})</span>
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
            }}
          >
            {CAT_STATES.map(state => (
              <figure key={state} className="card card-a" style={{ margin: 0, padding: 8 }} data-cat-cell={`${cat.id}-${state}`}>
                <Cat catId={cat.id} state={state as CatState} size={150} showGround />
                <figcaption className="muted" style={{ textAlign: 'center', fontSize: 11 }}>
                  {state}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      <section className="kit-section">
        <h2>Expression overrides</h2>
        <p className="muted">Same WAITING pose, six faces.</p>
        <SketchCard variant="b">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              justifyContent: 'space-around',
            }}
          >
            {(['neutral', 'hopeful', 'stare', 'sad', 'happyShut', 'sleep'] as const).map(expr => (
              <figure key={expr} style={{ margin: 0 }}>
                <Cat catId="orange" state="WAITING" expression={expr} size={110} />
                <figcaption className="muted" style={{ textAlign: 'center', fontSize: 11 }}>
                  {expr}
                </figcaption>
              </figure>
            ))}
          </div>
        </SketchCard>
      </section>
    </main>
  );
}
