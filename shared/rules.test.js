import { describe, expect, it } from 'vitest';
import rules from './rules.json' with { type: 'json' };
import tuning from './tuning.json' with { type: 'json' };

function expectIntegerNumbers(value) {
  if (typeof value === 'number') {
    expect(Number.isSafeInteger(value)).toBe(true);
  } else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) expectIntegerNumbers(child);
  }
}

describe('Phase 0 shared configuration', () => {
  it('loads the shared workspace', () => {
    expect(tuning.simulation.hz).toBe(60);
  });

  it('keeps all numeric defaults safe integers', () => {
    expectIntegerNumbers(rules);
    expectIntegerNumbers(tuning);
  });

  it('records the authoritative strike and round outcomes', () => {
    expect(rules.rounds).toEqual({
      winsToMatch: 2,
      timerSeconds: 99,
      simultaneousStrikes: 'trade',
      throwVsActiveStrike: 'strikeWins',
      throwVsAttackStartup: 'throwWins',
      doubleKo: 'bothAwardedRoundPoint',
      doubleMatchPoint: 'suddenDeathExtraRound',
      timeoutComparison: 'hpPercentage',
      timeoutTie: 'sameAsDoubleKo',
    });
  });

  it('records block heights and disallows air blocking', () => {
    expect(rules.blocking).toEqual({
      levels: ['high', 'mid', 'low', 'overhead'],
      standing: ['high', 'mid', 'overhead'],
      crouching: ['high', 'mid', 'low'],
      airAttackLevel: 'mid',
      airBlock: false,
    });
  });

  it('records throw and escape defaults in subpixels and frames', () => {
    expect(rules.throw).toEqual({
      rangeSubpixels: 60 * tuning.simulation.subpixelsPerPixel,
      startupFrames: 3,
      invulnerabilityFrames: 0,
      requiresBothGrounded: true,
      requiresBothActionable: true,
      escapeButtons: ['C', 'D'],
      escapeWindowFrames: 12,
      escapeResult: 'pushApartWithoutDamage',
      forbiddenTargetStates: [
        'hitstun',
        'blockstun',
        'knockdown',
        'airborne',
        'roll',
      ],
    });
  });

  it('preserves hitstop input recording and freezes buffer aging', () => {
    expect(rules.hitstop).toEqual({
      freezeRoundTimer: true,
      freezeAffectedProjectiles: true,
      freezeAffectedAnimations: true,
      recordInputHistory: true,
      ageInputBuffer: false,
    });
    expect(tuning.input.bufferFrames).toBeGreaterThanOrEqual(4);
    expect(tuning.input.bufferFrames).toBeLessThanOrEqual(6);
  });

  it('records immediate jumps, hop and run windows', () => {
    expect(rules.jump).toEqual({
      startOnUpPress: true,
      shortHopReleaseWindowFrames: 3,
      shortHopVelocity: 'reduced',
      superJumpMotion: ['DOWN', 'UP'],
      superJumpWindowFrames: 8,
    });
    expect(rules.run).toEqual({
      trigger: 'doubleTapForward',
      doubleTapWindowFrames: 10,
      dedicatedTouchButtonAllowed: true,
    });
  });

  it('records meter costs without inventing per-move gain amounts', () => {
    expect(rules.power).toEqual({
      max: 3000,
      stockSize: 1000,
      exCost: 500,
      superCost: 1000,
      dealtGainSource: 'move.meterGain',
      takenGainSource: 'move.damageTakenMeterGain',
    });
  });

  it('records sequential teams, HP carry and team meter', () => {
    expect(rules.teamBattle).toEqual({
      fightersPerTeam: 3,
      hpPerFighter: true,
      replacementOrder: 'selectedOrder',
      winnerKeepsHp: true,
      nextFighterHp: 'full',
      powerPerTeam: true,
      powerCarriesOver: true,
      victory: 'allOpponentsKo',
      boutTimerSeconds: 60,
      timeoutComparison: 'hpPercentage',
      timeoutLoser: 'removed',
      timeoutTie: 'bothRemoved',
      doubleKo: 'bothReplaced',
    });
  });

  it('keeps assist delays and rollback budgets configurable', () => {
    expect(tuning.assist.framesPerDirection * '236'.length).toBe(6);
    expect(tuning.assist.framesPerDirection * '2363214'.length).toBe(14);
    expect(tuning.assist.buttonFrameAfterMotion).toBe(1);
    expect(tuning.assist.dropInStates).toEqual(['hitstun', 'knockdown']);
    expect(tuning.assist.cancelOnStickDirection).toBe(true);
    expect(tuning.assist.replaceOnNewShortcut).toBe(true);
    expect(tuning.assist.defaultTouch).toBe(true);
    expect(tuning.assist.defaultDesktop).toBe(false);
    expect(tuning.network.checksumHistoryFrames).toBeGreaterThanOrEqual(600);
    expect(tuning.loop.onlineMaxStepsPerRafIncludingResims).toBe(8);
    expect(tuning.network.pauseAfterNoInputMs).toBe(5000);
    expect(tuning.network.forfeitAfterNoInputMs).toBe(10000);
  });
});
