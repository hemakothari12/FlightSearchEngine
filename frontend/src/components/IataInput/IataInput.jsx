import { TextField } from '@mui/material';

const IATA_REGEX = /^[A-Z]{3}$/;

function IataInput({ label, placeholder, value, onChange, onBlur, touched, error: crossError }) {
  const formatError = touched && !IATA_REGEX.test(value)
    ? `Enter a 3-letter airport code (e.g. ${placeholder})`
    : '';

  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 3))}
      onBlur={onBlur}
      error={!!(formatError || crossError)}
      helperText={formatError || crossError || ' '}
      inputProps={{ maxLength: 3 }}
      placeholder={placeholder}
      required
      sx={{ width: 160 }}
    />
  );
}

export default IataInput;
