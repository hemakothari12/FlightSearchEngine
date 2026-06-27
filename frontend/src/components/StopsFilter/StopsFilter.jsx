import { Box, Chip, Typography } from '@mui/material';

const STOP_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Direct', value: 0 },
  { label: '1 Stop', value: 1 },
  { label: '2 Stops', value: 2 },
];

function StopsFilter({ value, onChange, availableStops }) {
  const options = STOP_OPTIONS.filter(
    (opt) => opt.value === 'all' || availableStops.has(opt.value)
  );

  return (
    <Box data-testid="stops-filter" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Typography variant="body2" color="text.secondary">Stops:</Typography>
      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          onClick={() => onChange(opt.value)}
          color={value === opt.value ? 'primary' : 'default'}
          variant={value === opt.value ? 'filled' : 'outlined'}
          size="small"
        />
      ))}
    </Box>
  );
}

export default StopsFilter;
