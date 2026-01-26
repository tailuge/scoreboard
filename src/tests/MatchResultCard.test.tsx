import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchResultCard } from '../components/MatchResultCard';
import { MatchResult } from '../types/match';

describe('MatchResultCard', () => {
  const mockResult: MatchResult = {
    id: '1',
    winner: 'Alice',
    loser: 'Bob',
    winnerScore: 100,
    loserScore: 85,
    gameType: 'snooker',
    timestamp: new Date('2026-01-26T12:00:00Z').getTime(),
  };

  it('renders winner and loser names', () => {
    render(<MatchResultCard result={mockResult} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders scores', () => {
    render(<MatchResultCard result={mockResult} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('renders game type', () => {
    render(<MatchResultCard result={mockResult} />);
    expect(screen.getByText(/snooker/i)).toBeInTheDocument();
  });
});
