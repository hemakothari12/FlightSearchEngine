import { Autocomplete, TextField, Box, Typography } from '@mui/material';

function AirportAutocomplete({ label, value, onChange, airports, error, helperText }) {
  const selected = airports.find((a) => a.code === value) || null;

  return (
    <Autocomplete
      options={airports}
      value={selected}
      onChange={(_, airport) => onChange(airport ? airport.code : '')}
      getOptionLabel={(airport) => `${airport.name}, ${airport.city}, ${airport.country}`}
      filterOptions={(options, { inputValue }) => {
        const q = inputValue.toLowerCase();
        return options.filter(
          (a) =>
            a.code.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q) ||
            a.country.toLowerCase().includes(q)
        );
      }}
      renderOption={(props, airport) => (
        <Box component="li" {...props} key={airport.code}>
          <Typography variant="body1" fontWeight={600} component="span">
            {airport.name}, {airport.city}, {airport.country}
          </Typography>
          <Typography
            variant="body2"
            component="span"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            {airport.code}
          </Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText || ' '}
          sx={{ width: 280 }}
        />
      )}
      isOptionEqualToValue={(option, val) => option.code === val.code}
      slotProps={{ popupIndicator: { tabIndex: -1 } }}
    />
  );
}

export default AirportAutocomplete;
