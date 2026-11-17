import { AppIcon, type IconName } from '@purrpose/cats';
import { CONSEQUENCE_TYPES, DRY_FOOD_GRAMS_PER_UNIT, VET_PACK_NAMES, type ConsequenceType } from '@purrpose/shared';
import { foodAmount, foodName, foodQty, t } from '../../i18n/index.js';

const ICON: Record<ConsequenceType, IconName> = { MEALS: 'meals', DRY_FOOD: 'dryFood', VET_CARE: 'vetCare' };

/** Ready-made amounts, in pantry units: cans; 100 g … 1 kg; the four care packs. */
export const PRESETS: Record<ConsequenceType, number[]> = {
  MEALS: [1, 2, 3, 5, 10],
  DRY_FOOD: [100, 250, 500, 1000].map(g => g / DRY_FOOD_GRAMS_PER_UNIT),
  VET_CARE: [1, 2, 3, 4],
};
export const DEFAULT_STAKE: Record<ConsequenceType, number> = { MEALS: 2, DRY_FOOD: 5, VET_CARE: 1 };

function presetLabel(type: ConsequenceType, units: number): string {
  if (type === 'VET_CARE') return t(VET_PACK_NAMES[units] ?? 'Care pack');
  return foodQty(type, units);
}

/**
 * What goes on the line: the kind of food, then how much — by ready-made packs
 * (100 g, 250 g … / the care packs) or one step at a time (a can, 50 g, a care share).
 */
export function FoodStake({
  type,
  amount,
  available,
  onType,
  onAmount,
}: {
  type: ConsequenceType;
  amount: number;
  /** Free food of each type. */
  available: Record<ConsequenceType, number>;
  onType: (t: ConsequenceType) => void;
  onAmount: (n: number) => void;
}) {
  const free = available[type] ?? 0;
  const over = amount > free;
  return (
    <div className="food-stake">
      <div className="food-stake-types" role="radiogroup" aria-label={t('What goes on the line?')}>
        {CONSEQUENCE_TYPES.map(ct => (
          <button
            key={ct}
            type="button"
            role="radio"
            aria-checked={ct === type}
            className={`food-type ${ct === type ? 'on' : ''}`}
            onClick={() => {
              onType(ct);
              onAmount(DEFAULT_STAKE[ct]);
            }}
          >
            <AppIcon name={ICON[ct]} size={26} />
            <span>{foodName(ct)}</span>
            <small>{t('{n} free', { n: foodQty(ct, available[ct] ?? 0) })}</small>
          </button>
        ))}
      </div>

      <div className="food-stake-presets">
        {PRESETS[type].map(n => (
          <button key={n} type="button" className={`chip ${amount === n ? 'chip-active' : ''}`} onClick={() => onAmount(n)}>
            {presetLabel(type, n)}
          </button>
        ))}
      </div>

      <div className="food-stake-step">
        <button type="button" aria-label={t('Less')} disabled={amount <= 1} onClick={() => onAmount(Math.max(1, amount - 1))}>
          −
        </button>
        <strong>{foodAmount(type, amount)}</strong>
        <button type="button" aria-label={t('More')} disabled={amount >= 9999} onClick={() => onAmount(Math.min(9999, amount + 1))}>
          +
        </button>
      </div>
      {over && (
        <p className="form-error" role="alert" style={{ margin: '6px 0 0', textAlign: 'center' }}>
          {t('Your pantry only has {n} free.', { n: foodAmount(type, free) })}{' '}
          <a href="/pantry">{t('Buy more')}</a>
        </p>
      )}
    </div>
  );
}
