import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchForm from '../../../components/SearchForm/SearchForm';

const mockAirports = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US', timezone: 'America/New_York' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US', timezone: 'America/Los_Angeles' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'US', timezone: 'America/Chicago' },
];

function renderSearchForm(props = {}) {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <SearchForm onSearch={jest.fn()} loading={false} airports={mockAirports} {...props} />
    </LocalizationProvider>
  );
}

describe('SearchForm', () => {
  test('renders origin, destination, date inputs and search button', () => {
    renderSearchForm();
    expect(screen.getByLabelText(/origin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /date/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('search button is disabled while loading', () => {
    renderSearchForm({ loading: true });
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
  });

  test('shows validation error when submitting without selecting an airport', async () => {
    renderSearchForm();
    userEvent.click(screen.getByRole('button', { name: /search/i }));
    await screen.findByText(/select an origin airport/i);
  });

  test('calls onSearch with correct args on valid submit', async () => {
    const onSearch = jest.fn();
    renderSearchForm({ onSearch });

    // Select origin
    userEvent.type(screen.getByLabelText(/origin/i), 'JFK');
    await waitFor(() => screen.getByText(/New York, US/));
    userEvent.click(screen.getByText(/New York, US/));

    // Select destination
    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    await waitFor(() => screen.getByText(/Los Angeles, US/));
    userEvent.click(screen.getByText(/Los Angeles, US/));

    userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('JFK', 'LAX', '2024-03-15');
    });
  });
});
