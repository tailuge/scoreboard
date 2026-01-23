import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LeaderboardPage from '../pages/leaderboard';

// Mock LeaderboardItem type if needed by the component, though the component imports it
// We just need to mock the API response structure

const mockData = [
  { id: '1', name: 'Player 1', score: 100, likes: 5 },
  { id: '2', name: 'Player 2', score: 90, likes: 2 },
  { id: '3', name: 'Player 3', score: 80, likes: 0 },
];

describe('LeaderboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/rank')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockData),
          ok: true,
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders the leaderboard page with three tables', async () => {
    render(<LeaderboardPage />);

    expect(screen.getByRole('heading', { name: /Leaderboard/i })).toBeInTheDocument();
    
    // Check for specific table headers
    expect(screen.getByText('Snooker')).toBeInTheDocument();
    expect(screen.getByText('9-Ball')).toBeInTheDocument();
    expect(screen.getByText('Three Cushion')).toBeInTheDocument();

    // Wait for any data to load to prevent act warning
    await waitFor(() => {
       expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0);
    });
  });

  it('fetches and displays leaderboard data', async () => {
    render(<LeaderboardPage />);

    // Wait for data to load
    await waitFor(() => {
      // Since we render 3 tables and mock data is same for all, 
      // we expect 'Player 1' to appear 3 times.
      const player1Elements = screen.getAllByText('Player 1');
      expect(player1Elements).toHaveLength(3);
    });

    // Check for scores
    const scoreElements = screen.getAllByText('100');
    expect(scoreElements).toHaveLength(3);
    
    // Check for trophies
    expect(screen.getAllByText('🏆')).toHaveLength(3);
  });

  it('handles like button click', async () => {
    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Player 1')).toHaveLength(3);
    });

    // Find the first like button for Player 1 (5 likes)
    const likeButtons = screen.getAllByText('👍 5');
    const firstButton = likeButtons[0];

    fireEvent.click(firstButton);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rank/1?ruletype='),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    // Optimistic update check or re-fetch check
    // The component updates local state on success.
    await waitFor(() => {
       expect(screen.getAllByText('👍 6')[0]).toBeInTheDocument();
    });
  });
});
