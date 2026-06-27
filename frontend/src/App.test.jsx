import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as searchApi from './api/searchApi';

jest.mock('./api/searchApi');

describe('App', () => {
  test('shows error alert when API returns an error', async () => {
    searchApi.searchFlights.mockRejectedValue(new Error('Unknown airport code: XXX'));

    render(<App />);

    userEvent.type(screen.getByLabelText(/origin/i), 'XXX');
    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/unknown airport code: XXX/i)).toBeInTheDocument();
  });

  test('shows results after successful search', async () => {
    searchApi.searchFlights.mockResolvedValue([
      {
        legs: [{
          flightNumber: 'SP101',
          airline: 'SkyPath Airways',
          origin: 'JFK',
          destination: 'LAX',
          departureTime: '2024-03-15T08:30:00',
          arrivalTime: '2024-03-15T11:45:00',
          aircraft: 'A320',
          price: 299,
        }],
        layoverMinutes: [],
        totalDuration: 375,
        totalPrice: 299,
      },
    ]);

    render(<App />);

    userEvent.type(screen.getByLabelText(/origin/i), 'JFK');
    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('SP101')).toBeInTheDocument();
    });
    expect(screen.getByText(/1 itinerary found/i)).toBeInTheDocument();
  });
});
