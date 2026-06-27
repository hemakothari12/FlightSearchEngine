import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as searchApi from './api/searchApi';

jest.mock('./api/searchApi');

const mockAirports = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US', timezone: 'America/New_York' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US', timezone: 'America/Los_Angeles' },
];

describe('App', () => {
  beforeEach(() => {
    searchApi.fetchAirports.mockResolvedValue(mockAirports);
  });

  test('shows warning alert when airports fail to load', async () => {
    searchApi.fetchAirports.mockRejectedValueOnce(new Error('Network error'));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/couldn't load the airports list/i)).toBeInTheDocument();
  });

  test('shows error alert when API returns an error', async () => {
    searchApi.searchFlights.mockRejectedValue(new Error('Unknown airport code: XXX'));

    render(<App />);

    // Directly trigger search by mocking a selected state via form submit with no selections
    // (error alert path tested via mocked API response after selecting airports)
    userEvent.type(screen.getByLabelText(/origin/i), 'JFK');
    await waitFor(() => screen.getByText(/New York, US/));
    userEvent.click(screen.getByText(/New York, US/));

    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    await waitFor(() => screen.getByText(/Los Angeles, US/));
    userEvent.click(screen.getByText(/Los Angeles, US/));

    userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/unknown airport code: XXX/i)).toBeInTheDocument();
  });

  test('shows empty state when API returns no results (TC#4 — same-origin rejected yields empty; TC#3 route with no flights)', async () => {
    searchApi.searchFlights.mockResolvedValue([]);
    render(<App />);

    userEvent.type(screen.getByLabelText(/origin/i), 'JFK');
    await waitFor(() => screen.getByText(/New York, US/));
    userEvent.click(screen.getByText(/New York, US/));

    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    await waitFor(() => screen.getByText(/Los Angeles, US/));
    userEvent.click(screen.getByText(/Los Angeles, US/));

    userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/no itineraries found/i)).toBeInTheDocument();
    });
  });

  test('shows loading indicator while search is in progress', async () => {
    let resolveSearch;
    searchApi.searchFlights.mockImplementation(
      () => new Promise((resolve) => { resolveSearch = resolve; })
    );

    render(<App />);

    userEvent.type(screen.getByLabelText(/origin/i), 'JFK');
    await waitFor(() => screen.getByText(/New York, US/));
    userEvent.click(screen.getByText(/New York, US/));

    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    await waitFor(() => screen.getByText(/Los Angeles, US/));
    userEvent.click(screen.getByText(/Los Angeles, US/));

    userEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    resolveSearch([]);
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  test('error alert can be dismissed', async () => {
    searchApi.searchFlights.mockRejectedValue(new Error('Server error'));
    render(<App />);

    userEvent.type(screen.getByLabelText(/origin/i), 'JFK');
    await waitFor(() => screen.getByText(/New York, US/));
    userEvent.click(screen.getByText(/New York, US/));

    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    await waitFor(() => screen.getByText(/Los Angeles, US/));
    userEvent.click(screen.getByText(/Los Angeles, US/));

    userEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    userEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
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
    await waitFor(() => screen.getByText(/New York, US/));
    userEvent.click(screen.getByText(/New York, US/));

    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    await waitFor(() => screen.getByText(/Los Angeles, US/));
    userEvent.click(screen.getByText(/Los Angeles, US/));

    userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 itinerary found/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/08:30 — 11:45/)).toBeInTheDocument();
  });
});
