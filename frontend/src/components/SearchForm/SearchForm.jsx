import { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import dayjs from 'dayjs';
import AirportAutocomplete from '../AirportAutocomplete/AirportAutocomplete';
import SearchDatePicker from '../SearchDatePicker/SearchDatePicker';

const DEFAULT_DATE = dayjs('2024-03-15');

function SearchForm({ onSearch, loading, airports }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(DEFAULT_DATE);
  const [submitted, setSubmitted] = useState(false);

  const sameAirport = origin && destination && origin === destination;

  const isValid = origin && destination && !sameAirport && date && date.isValid();

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    onSearch(origin, destination, date.format('YYYY-MM-DD'));
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" flexWrap="wrap">
        <AirportAutocomplete
          label="Origin"
          value={origin}
          onChange={setOrigin}
          airports={airports}
          error={submitted && (!origin || sameAirport)}
          helperText={
            submitted && !origin
              ? 'Select an origin airport'
              : sameAirport
              ? 'Origin and destination must be different'
              : ''
          }
        />
        <AirportAutocomplete
          label="Destination"
          value={destination}
          onChange={setDestination}
          airports={airports}
          error={submitted && (!destination || sameAirport)}
          helperText={
            submitted && !destination
              ? 'Select a destination airport'
              : sameAirport
              ? 'Origin and destination must be different'
              : ''
          }
        />
        <SearchDatePicker value={date} onChange={setDate} />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 0.5, height: 56 }}
        >
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </Stack>
    </Box>
  );
}

export default SearchForm;
