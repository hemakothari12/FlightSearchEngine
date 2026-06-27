import { render, screen } from '@testing-library/react';
import LayoverBadge from '../../../components/LayoverBadge/LayoverBadge';

describe('LayoverBadge', () => {
  test('renders hours and minutes when layover >= 60 min', () => {
    render(<LayoverBadge airport="ORD" minutes={90} />);
    expect(screen.getByText(/Layover at ORD: 1h 30m/)).toBeInTheDocument();
  });

  test('renders minutes only when layover < 60 min', () => {
    render(<LayoverBadge airport="LAX" minutes={45} />);
    expect(screen.getByText(/Layover at LAX: 45m/)).toBeInTheDocument();
  });

  test('renders 0m remainder correctly for exact-hour layover', () => {
    render(<LayoverBadge airport="JFK" minutes={120} />);
    expect(screen.getByText(/Layover at JFK: 2h 0m/)).toBeInTheDocument();
  });

  test('renders the correct airport code', () => {
    render(<LayoverBadge airport="DXB" minutes={360} />);
    expect(screen.getByText(/Layover at DXB/)).toBeInTheDocument();
  });
});
