import { render, screen } from '@testing-library/react';
import ResultsPanel from '../../../components/ResultsPanel/ResultsPanel';

const mockItinerary = (depTime, arrTime, duration, price) => ({
  legs: [
    {
      flightNumber: 'SP101',
      airline: 'SkyPath Airways',
      origin: 'JFK',
      destination: 'LAX',
      departureTime: `2024-03-15T${depTime}:00`,
      arrivalTime: `2024-03-15T${arrTime}:00`,
      aircraft: 'A320',
      price,
    },
  ],
  layoverMinutes: [],
  totalDuration: duration,
  totalPrice: price,
});

describe('ResultsPanel', () => {
  test('renders nothing when itineraries is null', () => {
    const { container } = render(<ResultsPanel itineraries={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders correct number of itinerary cards', () => {
    const itineraries = [
      mockItinerary('08:30', '11:45', 375, 299),
      mockItinerary('14:00', '17:15', 405, 329),
      mockItinerary('19:30', '22:45', 435, 279),
    ];
    render(<ResultsPanel itineraries={itineraries} />);
    expect(screen.getByText('3 itineraries found, sorted by travel time')).toBeInTheDocument();
    expect(screen.getByText(/08:30 — 11:45/)).toBeInTheDocument();
    expect(screen.getByText(/14:00 — 17:15/)).toBeInTheDocument();
    expect(screen.getByText(/19:30 — 22:45/)).toBeInTheDocument();
  });

  test('renders singular label for one itinerary', () => {
    render(<ResultsPanel itineraries={[mockItinerary('08:30', '11:45', 375, 299)]} />);
    expect(screen.getByText('1 itinerary found, sorted by travel time')).toBeInTheDocument();
  });

  test('renders empty state alert when no itineraries found', () => {
    render(<ResultsPanel itineraries={[]} />);
    expect(screen.getByText(/no itineraries found/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
