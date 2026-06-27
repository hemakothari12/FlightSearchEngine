import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsPanel from '../../../components/ResultsPanel/ResultsPanel';

const makeItinerary = (depTime, arrTime, duration, price, stops = 0) => ({
  legs: [
    {
      flightNumber: 'SP101',
      airline: 'SkyPath Airways',
      origin: 'JFK',
      destination: stops > 0 ? 'ORD' : 'LAX',
      departureTime: `2024-03-15T${depTime}:00`,
      arrivalTime: `2024-03-15T${arrTime}:00`,
      aircraft: 'A320',
      price,
    },
    ...(stops > 0 ? [{
      flightNumber: 'SP102',
      airline: 'SkyPath Airways',
      origin: 'ORD',
      destination: 'LAX',
      departureTime: `2024-03-15T${arrTime}:00`,
      arrivalTime: `2024-03-15T12:00:00`,
      aircraft: 'A321',
      price,
    }] : []),
  ],
  layoverMinutes: stops > 0 ? [60] : [],
  totalDuration: duration,
  totalPrice: price,
});

const direct1   = makeItinerary('08:30', '11:45', 375, 299, 0);
const direct2   = makeItinerary('14:00', '17:15', 405, 199, 0);
const oneStop   = makeItinerary('07:00', '09:00', 480, 149, 1);

describe('ResultsPanel', () => {
  test('renders nothing when itineraries is null', () => {
    const { container } = render(<ResultsPanel itineraries={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders empty state alert when no itineraries found', () => {
    render(<ResultsPanel itineraries={[]} />);
    expect(screen.getByText(/no itineraries found/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('renders correct number of cards', () => {
    render(<ResultsPanel itineraries={[direct1, direct2, oneStop]} />);
    expect(screen.getByText(/08:30 — 11:45/)).toBeInTheDocument();
    expect(screen.getByText(/14:00 — 17:15/)).toBeInTheDocument();
  });

  test('renders singular label for one itinerary', () => {
    render(<ResultsPanel itineraries={[direct1]} />);
    expect(screen.getByText(/1 itinerary found/i)).toBeInTheDocument();
  });

  test('defaults to sort by duration', () => {
    render(<ResultsPanel itineraries={[direct1, direct2]} />);
    expect(screen.getByRole('button', { name: /duration/i })).toHaveAttribute('aria-pressed', 'true');
  });

  test('switching sort to price re-orders results by price ascending', () => {
    render(<ResultsPanel itineraries={[direct1, direct2]} />);
    userEvent.click(screen.getByRole('button', { name: /price/i }));
    const cards = screen.getAllByText(/\$\d+/);
    const prices = cards.map((el) => parseInt(el.textContent.replace('$', '')));
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
  });

  test('stop filter chips only show available stop counts', () => {
    render(<ResultsPanel itineraries={[direct1, oneStop]} />);
    const filter = screen.getByTestId('stops-filter');
    expect(within(filter).getByText('Direct')).toBeInTheDocument();
    expect(within(filter).getByText('1 Stop')).toBeInTheDocument();
    expect(within(filter).queryByText('2 Stops')).not.toBeInTheDocument();
  });

  test('filtering by Direct hides 1-stop itineraries', () => {
    render(<ResultsPanel itineraries={[direct1, oneStop]} />);
    userEvent.click(within(screen.getByTestId('stops-filter')).getByText('Direct'));
    expect(screen.getByText(/08:30 — 11:45/)).toBeInTheDocument();
    expect(screen.queryByText(/07:00 — 09:00/)).not.toBeInTheDocument();
  });

  test('filtering by 1 Stop shows only 1-stop itineraries', () => {
    render(<ResultsPanel itineraries={[direct1, oneStop]} />);
    userEvent.click(within(screen.getByTestId('stops-filter')).getByText('1 Stop'));
    expect(screen.getByText(/07:00 — 12:00/)).toBeInTheDocument();
    expect(screen.queryByText(/08:30 — 11:45/)).not.toBeInTheDocument();
  });
});
