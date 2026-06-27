import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchForm from '../../../components/SearchForm/SearchForm';

function renderSearchForm(props = {}) {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <SearchForm onSearch={jest.fn()} loading={false} {...props} />
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

  test('shows validation error when IATA code is less than 3 characters', async () => {
    renderSearchForm();
    const originInput = screen.getByLabelText(/origin/i);
    userEvent.type(originInput, 'JF');
    userEvent.tab();
    const error = await screen.findByText(/3-letter airport code/i);
    expect(error).toBeInTheDocument();
  });

  test('calls onSearch with correct args on valid submit', async () => {
    const onSearch = jest.fn();
    renderSearchForm({ onSearch });

    userEvent.type(screen.getByLabelText(/origin/i), 'JFK');
    userEvent.type(screen.getByLabelText(/destination/i), 'LAX');
    userEvent.click(screen.getByRole('button', { name: /search/i }));

    await screen.findByRole('button', { name: /search/i });
    expect(onSearch).toHaveBeenCalledWith('JFK', 'LAX', '2024-03-15');
  });
});
