import { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import dayjs from 'dayjs';
import IataInput from '../IataInput/IataInput';
import SearchDatePicker from '../SearchDatePicker/SearchDatePicker';

const IATA_REGEX = /^[A-Z]{3}$/;
const DEFAULT_DATE = dayjs('2024-03-15');

function SearchForm({ onSearch, loading }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(DEFAULT_DATE);
  const [touched, setTouched] = useState({ origin: false, destination: false });

  const sameAirportError =
    touched.origin && touched.destination &&
    IATA_REGEX.test(origin) && IATA_REGEX.test(destination) &&
    origin === destination
      ? 'Origin and destination must be different'
      : '';

  const isValid =
    IATA_REGEX.test(origin) &&
    IATA_REGEX.test(destination) &&
    origin !== destination &&
    date && date.isValid();

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ origin: true, destination: true });
    if (!isValid) return;
    onSearch(origin, destination, date.format('YYYY-MM-DD'));
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
        <IataInput
          label="Origin"
          placeholder="JFK"
          value={origin}
          onChange={setOrigin}
          onBlur={() => setTouched((t) => ({ ...t, origin: true }))}
          touched={touched.origin}
          error={sameAirportError}
        />
        <IataInput
          label="Destination"
          placeholder="LAX"
          value={destination}
          onChange={setDestination}
          onBlur={() => setTouched((t) => ({ ...t, destination: true }))}
          touched={touched.destination}
          error={sameAirportError}
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
