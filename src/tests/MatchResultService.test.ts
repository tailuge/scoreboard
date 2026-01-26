import { MatchResultService } from '../services/MatchResultService';
import { mockKv } from './mockkv';
import { MatchResult } from '../types/match';

describe('MatchResultService', () => {
  let service: MatchResultService;

  beforeEach(async () => {
    // @ts-ignore
    await mockKv.flushall();
    service = new MatchResultService(mockKv as any);
  });

  it('should add a match result and retrieve it', async () => {
    const result: MatchResult = {
      id: 'match1',
      winner: 'Winner',
      loser: 'Loser',
      winnerScore: 100,
      loserScore: 50,
      gameType: 'snooker',
      timestamp: Date.now(),
    };

    await service.addMatchResult(result);
    const history = await service.getMatchResults();

    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(result);
  });

  it('should maintain a rolling history limit', async () => {
    // Add 60 matches when limit is 50
    for (let i = 0; i < 60; i++) {
      const result: MatchResult = {
        id: `match${i}`,
        winner: `Winner${i}`,
        loser: `Loser${i}`,
        winnerScore: 100,
        loserScore: 50,
        gameType: 'snooker',
        timestamp: Date.now() + i, // Ensure distinct timestamps
      };
      await service.addMatchResult(result);
    }

    const history = await service.getMatchResults();
    expect(history).toHaveLength(50);
    // Should be latest matches (59 down to 10)
    expect(history[0].id).toBe('match59');
  });
});
