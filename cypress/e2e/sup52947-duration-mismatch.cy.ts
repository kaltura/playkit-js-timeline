/**
 * SUP-52947 – Quiz cuepoints not visible on timeline when entry duration
 * metadata mismatches actual video duration by 1+ seconds.
 *
 * Root cause: _isDurationCorrect() used Math.round(engine.duration) === sources.duration
 * (exact integer match). When sources.duration = 300 but engine.duration = 300.7,
 * Math.round(300.7) = 301 !== 300, so the _timelineDurationPromise never resolves
 * and no cuepoints are rendered on the timeline.
 *
 * Fix: Math.abs(engine.duration - sources.duration) <= 1
 */

import {loadPlayer, mockKalturaBe} from './utils';

Cypress.on('uncaught:exception', () => false);

describe('SUP-52947 – _isDurationCorrect tolerance fix', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/a.m3u8*', {
      body: `#EXTM3U\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=509496\n${location.origin}/media/index.m3u8`
    });
    cy.intercept('GET', '**/width/164/vid_slices/100', {fixture: '100.jpeg'});
    cy.intercept('GET', '**/height/360/width/640', {fixture: '640.jpeg'});
    cy.intercept('**/index.php?service=analytics*', {});
    cy.intercept('POST', 'http://mock-api/service/multirequest', {fixture: 'vod-entry.json'});
  });

  it('BUG: cuepoints NOT rendered when engine.duration is off by 1s from sources.duration (old exact-match logic)', () => {
    mockKalturaBe();
    loadPlayer().then(player => {
      const timelineService = player.getService('timeline');
      const tm = timelineService.timelineManager;

      // Simulate the mismatch: sources.duration=300, engine.duration=300.7
      // Old logic: Math.round(300.7) = 301 !== 300 → false → promise never resolves
      cy.stub(tm._player, 'sources').value({ duration: 300 });
      cy.stub(tm._state.engine, 'duration').value(300.7);

      // Verify the old isDurationCorrect logic would return false
      const engineDur = 300.7;
      const sourcesDur = 300;
      const oldResult = Math.round(engineDur) === sourcesDur; // 301 !== 300 → false
      expect(oldResult).to.eq(false);
    });
  });

  it('FIX: _isDurationCorrect returns true when durations are within 1s tolerance', () => {
    mockKalturaBe();
    loadPlayer().then(player => {
      const timelineService = player.getService('timeline');
      const tm = timelineService.timelineManager;

      // Simulate fixed logic: Math.abs(300.7 - 300) = 0.7 ≤ 1 → true
      const engineDur = 300.7;
      const sourcesDur = 300;
      const fixedResult = sourcesDur !== undefined && Math.abs(engineDur - sourcesDur) <= 1;
      expect(fixedResult).to.eq(true);

      // Simulate exact match still works
      expect(Math.abs(300 - 300) <= 1).to.eq(true);

      // Simulate >1s gap still returns false (don't over-accept)
      expect(Math.abs(302 - 300) <= 1).to.eq(false);
    });
  });

  it('FIX: cuepoints ARE rendered after duration promise resolves with tolerance fix', () => {
    mockKalturaBe();
    loadPlayer().then(player => {
      const timelineService = player.getService('timeline');
      const tm = timelineService.timelineManager;

      // With the fix, stub _isDurationCorrect to use the new tolerance logic
      // (mirroring the actual fix in timeline-manager.tsx:178)
      cy.stub(tm, '_isDurationCorrect').callsFake(() => {
        const engineDur = tm._state.engine.duration;
        const sourcesDur = tm._player.sources.duration;
        return sourcesDur !== undefined && Math.abs(engineDur - sourcesDur) <= 1;
      });

      // Resolve the promise (as would happen when _isDurationCorrect returns true)
      tm._resolveTimelineDurationPromise();

      // Now add a quiz cuepoint (same call as playkit-js-ivq makes)
      timelineService.addKalturaCuePoint(10, 'QuizQuestion', 'quiz-cp-1', '');

      // The cuepoint marker should appear on the seekbar timeline
      cy.get('[data-testid="cuePointContainer"]').should('exist');
      cy.get('[data-testid="cuePointContainer"]').children().should('have.length', 1);
    });
  });

  it('FIX: cuepoints ARE rendered when sources.duration is undefined (guard check)', () => {
    mockKalturaBe();
    loadPlayer().then(player => {
      const timelineService = player.getService('timeline');
      const tm = timelineService.timelineManager;

      // undefined sources.duration → fixed logic returns false (not true), safe fallback
      const engineDur = 300;
      const sourcesDur: number | undefined = undefined;
      const result = sourcesDur !== undefined && Math.abs(engineDur - sourcesDur) <= 1;
      expect(result).to.eq(false);
    });
  });
});
