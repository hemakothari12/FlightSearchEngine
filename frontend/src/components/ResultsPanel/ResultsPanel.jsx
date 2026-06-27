import { Box, Typography, Alert } from '@mui/material';
import ItineraryCard from '../ItineraryCard/ItineraryCard';

function ResultsPanel({ itineraries }) {
  if (itineraries === null) return null;

  if (itineraries.length === 0) {
    return (
      <Alert severity="info">
        No itineraries found for this route and date.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        {itineraries.length} itinerar{itineraries.length === 1 ? 'y' : 'ies'} found, sorted by travel time
      </Typography>
      {itineraries.map((it, i) => (
        <ItineraryCard key={i} itinerary={it} />
      ))}
    </Box>
  );
}

export default ResultsPanel;
