import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  stops: 0,
  totalLayover: 0,
};

const twoStopItinerary = {
  legs: [
    { flightNumber: 'SP301', airline: 'SkyPath Airways', origin: 'JFK', destination: 'ORD',
      departureTime: '2024-03-15T07:00:00', arrivalTime: '2024-03-15T08:30:00', aircraft: 'A319', price: 150 },
    { flightNumber: 'SP302', airline: 'SkyPath Airways', origin: 'ORD', destination: 'LAX',
      departureTime: '2024-03-15T09:30:00', arrivalTime: '2024-03-15T11:30:00', aircraft: 'A320', price: 150 },
    { flightNumber: 'SP303', airline: 'SkyPath Airways', origin: 'LAX', destination: 'SFO',
      departureTime: '2024-03-15T13:00:00', arrivalTime: '2024-03-15T14:30:00', aircraft: 'B737', price: 100 },
  ],
  layoverMinutes: [60, 90],
  totalDuration: 450,
  totalPrice: 400,
  stops: 2,
  totalLayover: 150,
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
  stops: 1,
  totalLayover: 60,
};

describe('ItineraryCard', () => {
  test('renders departure and arrival times', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText(/08:30 — 11:45/)).toBeInTheDocument();
  });

  test('renders airline name', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText('SkyPath Airways')).toBeInTheDocument();
  });

  test('renders total duration and route', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText('6h 15m')).toBeInTheDocument();
    expect(screen.getByText('JFK–LAX')).toBeInTheDocument();
  });

  test('renders Direct for single-leg itinerary', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  test('renders total price', () => {
    render(<ItineraryCard itinerary={directItinerary} />);
    expect(screen.getByText('$299')).toBeInTheDocument();
  });

  test('renders 1 stop and layover info for one-stop itinerary', () => {
    render(<ItineraryCard itinerary={oneStopItinerary} />);
    expect(screen.getByText('1 stop')).toBeInTheDocument();
    expect(screen.getByText(/Layover at ORD: 1h 0m/)).toBeInTheDocument();
  });

  test('flight details are hidden by default and shown after expanding', () => {
    render(<ItineraryCard itinerary={oneStopItinerary} />);
    expect(screen.queryByText('SP201')).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /expand flight details/i }));
    expect(screen.getByText('SP201')).toBeInTheDocument();
    expect(screen.getByText('SP202')).toBeInTheDocument();
  });

  test('collapses flight details on second click', () => {
    render(<ItineraryCard itinerary={oneStopItinerary} />);
    userEvent.click(screen.getByRole('button', { name: /expand flight details/i }));
    userEvent.click(screen.getByRole('button', { name: /collapse flight details/i }));
    // verify toggle reverted — MUI Collapse CSS transitions don't run in jsdom
    expect(screen.getByRole('button', { name: /expand flight details/i })).toBeInTheDocument();
  });

  test('renders 2 stops and two layover badges for two-stop itinerary', () => {
    render(<ItineraryCard itinerary={twoStopItinerary} />);
    expect(screen.getByText('2 stops')).toBeInTheDocument();
    expect(screen.getByText(/Layover at ORD: 1h 0m/)).toBeInTheDocument();
    expect(screen.getByText(/Layover at LAX: 1h 30m/)).toBeInTheDocument();
  });

  test('expanded view shows flight numbers and aircraft types', () => {
    render(<ItineraryCard itinerary={twoStopItinerary} />);
    userEvent.click(screen.getByRole('button', { name: /expand flight details/i }));
    expect(screen.getByText('SP301')).toBeInTheDocument();
    expect(screen.getByText('SP302')).toBeInTheDocument();
    expect(screen.getByText('SP303')).toBeInTheDocument();
    // aircraft rendered as "· A319" — match by content substring
    expect(screen.getByText(/A319/)).toBeInTheDocument();
    expect(screen.getByText(/A320/)).toBeInTheDocument();
    expect(screen.getByText(/B737/)).toBeInTheDocument();
  });

  test('renders +1 indicator when arrival is next day', () => {
    const overnight = {
      ...directItinerary,
      legs: [{
        ...directItinerary.legs[0],
        departureTime: '2024-03-15T22:00:00',
        arrivalTime: '2024-03-16T05:00:00',
      }],
    };
    render(<ItineraryCard itinerary={overnight} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
