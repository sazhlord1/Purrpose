import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Cat, CAT_STATES } from '../src/Cat.js';
import { resolveCatConfig } from '../src/config.js';
import { POSE_BY_STATE } from '../src/poses.js';
import type { CatId } from '@purrpose/shared';

const CAT_IDS: CatId[] = ['orange', 'tuxedo', 'black', 'boba', 'ziggy'];

function render(catId: CatId, state: (typeof CAT_STATES)[number]) {
  return renderToString(createElement(Cat, { catId, state }));
}

describe('<Cat> static poses', () => {
  it('renders all 40 cat × state combos without throwing', () => {
    for (const catId of CAT_IDS) {
      for (const state of CAT_STATES) {
        const html = render(catId, state);
        expect(html).toContain(`data-cat="${catId}"`);
        expect(html).toContain(`data-state="${state}"`);
        expect(html).toContain('data-part="body"');
        expect(html).toContain('data-part="head"');
      }
    }
  });

  it('renders each pose body exactly once per output', () => {
    for (const state of CAT_STATES) {
      const html = render('orange', state);
      expect(html).toContain(POSE_BY_STATE[state].bodyD.slice(0, 24));
    }
  });

  it('differentiates tail anatomy across the cats', () => {
    expect(render('orange', 'WAITING')).toContain('data-tail="bigCurl"');
    expect(render('tuxedo', 'WAITING')).toContain('data-tail="longPlume"');
    expect(render('black', 'WAITING')).toContain('data-tail="lowHook"');
    expect(render('boba', 'WAITING')).toContain('data-tail="fluffyPuff"');
    expect(render('ziggy', 'WAITING')).toContain('data-tail="zigzag"');
  });

  it('differentiates ear anatomy across cats', () => {
    expect(render('orange', 'INITIAL')).toContain('data-ears="pointy"');
    expect(render('tuxedo', 'INITIAL')).toContain('data-ears="roundTall"');
    expect(render('black', 'INITIAL')).toContain('data-ears="pointy"');
    expect(render('boba', 'INITIAL')).toContain('data-ears="roundSoft"');
    expect(render('ziggy', 'INITIAL')).toContain('data-ears="batEars"');
  });

  it('differentiates eye shapes across cats', () => {
    expect(render('orange', 'WAITING')).toContain('data-eyes="dotWide"');
    expect(render('tuxedo', 'WAITING')).toContain('data-eyes="almond"');
    expect(render('black', 'WAITING')).toContain('data-eyes="narrowSly"');
    expect(render('boba', 'WAITING')).toContain('data-eyes="bigGleam"');
    expect(render('ziggy', 'WAITING')).toContain('data-eyes="wideWild"');
  });

  it('maps default expressions per state', () => {
    expect(render('orange', 'VERY_CLOSE')).toContain('data-expression="stare"');
    expect(render('orange', 'SUCCESS')).toContain('data-expression="sad"');
    expect(render('orange', 'FAILURE')).toContain('data-expression="happyShut"');
    expect(render('orange', 'SLEEPING')).toContain('data-expression="sleep"');
  });

  it('lets expression overrides win over the state default', () => {
    const overridden = renderToString(
      createElement(Cat, { catId: 'orange', state: 'SUCCESS', expression: 'happyShut' }),
    );
    expect(overridden).toContain('data-expression="happyShut"');
  });

  it('draws dark-cat faces in paper ink for contrast', () => {
    const black = render('black', 'ANTICIPATING');
    expect(black).toContain(`stroke="#FAF6EE"`);
  });

  it('keeps tuxedo silhouettes clean without a markings overlay', () => {
    expect(render('tuxedo', 'WAITING')).not.toContain('data-part="markings"');
  });

  it('resolves configs from the shared seed and rejects unknown ids', () => {
    expect(resolveCatConfig('orange').structure.tailPath).toBe('bigCurl');
    expect(resolveCatConfig('boba').structure.tailPath).toBe('fluffyPuff');
    expect(resolveCatConfig('ziggy').structure.tailPath).toBe('zigzag');
    expect(() => resolveCatConfig('sphinx' as CatId)).toThrow(/Unknown catId/);
  });
});
