import { render, screen } from '@testing-library/react';
import ItineraryCard from '../../../components/ItineraryCard/ItineraryCard';

const directItinerary = {
  legs: [
    {
      flightNumber: 'SP101',
      airline: 'SkyPath Airways',
      origin: 'JFK',
      destination: 'LAX',
      departureTime: '2024-03-15T08:30:00',
      arrivalTime: '2024-03-15T11:45:00',
      aircraft: 'A320',
      price: 299,
    },
  ],
  layoverMinutes: [],
  totalDuration: 375,
  totalPrice: 299,
};

const oneStopItinerary = {
  legs: [
    {
      flightNumber: 'SP201',
      airline: 'SkyPath Airways',
      origin: 'JFK',
      destination: 'ORD',
      departureTime: '2024-03-15T07:00:00',
      arrivalTime: '2024-03-15T08:30:00',
      aircraft: 'B737',
      price: 199,
    },
    {
      flightNumber: 'SP202',
      airline: 'SkyPath Airways',
      origin: 'ORD',
      destination: 'LAX',
      departureTime: '2024-03-15T09:30:00',
      arrivalTime: '2024-03-15T11:30:00',
      aircraft: 'A321',
      price: 179,
    },
  ],
  layoverMinutes: [60],
  totalDuration: 270,
  totalPrice: 378,
};

describe('ItineraryCard', () => {
  test('renders flight number, airline, route and times for direct flight', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText('SP101')).toBeInTheDocument();
    expect(screen.getByText('SkyPath Airways')).toBeInTheDocument();
    expect(screen.getByText('JFK')).toBeInTheDocument();
    expect(screen.getByText('LAX')).toBeInTheDocument();
    expect(screen.getByText(/08:30/)).toBeInTheDocument();
    expect(screen.getByText(/11:45/)).toBeInTheDocument();
    expect(screen.getByText(/A320/)).toBeInTheDocument();
  });

  test('renders total duration and price in header', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText('6h 15m')).toBeInTheDocument();
    expect(screen.getByText('$299')).toBeInTheDocument();
  });

  test('renders Direct chip for single-leg itinerary', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  test('renders layover badge between segments for 1-stop itinerary', () => {
    render(<ItineraryCard itinerary={oneStopItinerary} />);
    expect(screen.getByText(/Layover at ORD/)).toBeInTheDocument();
    expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
  });

  test('renders 1 Stop chip for one-stop itinerary', () => {
    render(<ItineraryCard itinerary={oneStopItinerary} />);
    expect(screen.getByText('1 Stop')).toBeInTheDocument();
  });
});
