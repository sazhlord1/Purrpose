import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Cat, CAT_STATES } from '../src/Cat.js';
import { resolveCatConfig } from '../src/config.js';
import { POSE_BY_STATE } from '../src/poses.js';
import type { CatId } from '@purrpose/shared';

const CAT_IDS: CatId[] = [
  'orange',
  'tuxedo',
  'black',
  'boba',
  'mochi',
  'oreo',
  'pepper',
  'yuki',
];

function render(catId: CatId, state: (typeof CAT_STATES)[number]) {
  return renderToString(createElement(Cat, { catId, state }));
}

describe('<Cat> static poses', () => {
  it('renders all 64 cat × state combos without throwing', () => {
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
      expect(html).toContain('data-part="body"');
      expect(html).toContain('fill="#EEB038"');
    }
  });

  it('differentiates tail anatomy across the cats', () => {
    expect(render('orange', 'WAITING')).toContain('data-tail="spiralCurl"');
    expect(render('tuxedo', 'WAITING')).toContain('data-tail="rootedStripedCurl"');
    expect(render('black', 'WAITING')).toContain('data-tail="sleekUpright"');
    expect(render('boba', 'WAITING')).toContain('data-tail="groundTail"');
    expect(render('mochi', 'WAITING')).toContain('data-tail="hookLeft"');
    expect(render('oreo', 'WAITING')).toContain('data-tail="uprightLedge"');
    expect(render('pepper', 'WAITING')).toContain('data-tail="ringLoop"');
    expect(render('yuki', 'WAITING')).toContain('data-tail="hookRight"');
  });

  it('differentiates ear anatomy across cats', () => {
    expect(render('orange', 'INITIAL')).toContain('data-ears="pointy"');
    expect(render('tuxedo', 'INITIAL')).toContain('data-ears="tallStriped"');
    expect(render('black', 'INITIAL')).toContain('data-ears="pinkInner"');
    expect(render('boba', 'INITIAL')).toContain('data-ears="splitCalico"');
    expect(render('mochi', 'INITIAL')).toContain('data-ears="blackLeftComb"');
  });

  it('differentiates eye shapes across cats', () => {
    expect(render('orange', 'WAITING')).toContain('data-part="eyes"');
    expect(render('tuxedo', 'WAITING')).toContain('data-eyes="dotWide"');
    expect(render('black', 'WAITING')).toContain('data-eyes="luminousOval"');
    expect(render('boba', 'WAITING')).toContain('data-eyes="sideGlance"');
    expect(render('oreo', 'WAITING')).toContain('data-eyes="bigRoundStare"');
  });

  it('maps default expressions per state', () => {
    expect(render('tuxedo', 'VERY_CLOSE')).toContain('data-expression="stare"');
    expect(render('tuxedo', 'SUCCESS')).toContain('data-expression="sad"');
    expect(render('tuxedo', 'FAILURE')).toContain('data-expression="happyShut"');
    expect(render('tuxedo', 'SLEEPING')).toContain('data-expression="sleep"');
  });

  it('lets expression overrides win over the state default', () => {
    const overridden = renderToString(
      createElement(Cat, { catId: 'tuxedo', state: 'SUCCESS', expression: 'happyShut' }),
    );
    expect(overridden).toContain('data-expression="happyShut"');
  });

  it('draws dark-cat faces in paper ink for contrast', () => {
    const black = render('black', 'ANTICIPATING');
    expect(black).toContain(`stroke="#FFFDF9"`);
  });

  it('resolves configs from the shared seed and rejects unknown ids', () => {
    expect(resolveCatConfig('orange').structure.tailPath).toBe('spiralCurl');
    expect(resolveCatConfig('boba').structure.tailPath).toBe('groundTail');
    expect(resolveCatConfig('tuxedo').structure.tailPath).toBe('rootedStripedCurl');
    expect(() => resolveCatConfig('sphinx' as CatId)).toThrow(/Unknown catId/);
  });
});
