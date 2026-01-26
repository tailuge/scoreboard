import { MatchResult } from '../types/match';

describe('MatchResult Schema', () => {
  it('should define a valid MatchResult object', () => {
    const result: MatchResult = {
      id: 'test-match-id',
      winner: 'Player1',
      loser: 'Player2',
      winnerScore: 100,
      loserScore: 50,
      gameType: 'snooker',
      timestamp: Date.now(),
    };
    expect(result.winner).toBe('Player1');
  });
});
