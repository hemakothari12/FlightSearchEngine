import { ToggleButton, ToggleButtonGroup, Typography, Box } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';

function SortControl({ value, onChange }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <SortIcon fontSize="small" color="action" />
      <Typography variant="body2" color="text.secondary">Sort by:</Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, val) => val && onChange(val)}
        size="small"
      >
        <ToggleButton value="duration">Duration</ToggleButton>
        <ToggleButton value="price">Price</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

export default SortControl;
