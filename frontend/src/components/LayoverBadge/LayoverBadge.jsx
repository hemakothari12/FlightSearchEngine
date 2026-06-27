import { Box, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function LayoverBadge({ airport, minutes }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', pl: 4, py: 0.5 }}>
      <Chip
        icon={<AccessTimeIcon />}
        label={`Layover at ${airport}: ${formatDuration(minutes)}`}
        size="small"
        variant="outlined"
        color="default"
      />
    </Box>
  );
}

export default LayoverBadge;
