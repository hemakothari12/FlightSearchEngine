import { render, screen } from '@testing-library/react';
import ResultsPanel from '../../../components/ResultsPanel/ResultsPanel';

const mockItinerary = (flightNumber, duration, price) => ({
  legs: [
    {
      flightNumber,
      airline: 'SkyPath Airways',
      origin: 'JFK',
      destination: 'LAX',
      departureTime: '2024-03-15T08:30:00',
      arrivalTime: '2024-03-15T11:45:00',
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
      mockItinerary('SP101', 375, 299),
      mockItinerary('SP102', 405, 329),
      mockItinerary('SP103', 435, 279),
    ];
    render(<ResultsPanel itineraries={itineraries} />);
    expect(screen.getByText('3 itineraries found, sorted by travel time')).toBeInTheDocument();
    expect(screen.getByText('SP101')).toBeInTheDocument();
    expect(screen.getByText('SP102')).toBeInTheDocument();
    expect(screen.getByText('SP103')).toBeInTheDocument();
  });

  test('renders singular label for one itinerary', () => {
    render(<ResultsPanel itineraries={[mockItinerary('SP101', 375, 299)]} />);
    expect(screen.getByText('1 itinerary found, sorted by travel time')).toBeInTheDocument();
  });

  test('renders empty state alert when no itineraries found', () => {
    render(<ResultsPanel itineraries={[]} />);
    expect(screen.getByText(/no itineraries found/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
