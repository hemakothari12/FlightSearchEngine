import { useState, useMemo } from 'react';
import { Box, Typography, Alert, Divider } from '@mui/material';
import ItineraryCard from '../ItineraryCard/ItineraryCard';
import SortControl from '../SortControl/SortControl';
import StopsFilter from '../StopsFilter/StopsFilter';

function ResultsPanel({ itineraries }) {
  const [sortBy, setSortBy] = useState('duration');
  const [stopsFilter, setStopsFilter] = useState('all');

  const availableStops = useMemo(() => {
    if (!itineraries) return new Set();
    return new Set(itineraries.map((it) => it.legs.length - 1));
  }, [itineraries]);

  const displayed = useMemo(() => {
    if (!itineraries) return [];

    let result = stopsFilter === 'all'
      ? itineraries
      : itineraries.filter((it) => it.legs.length - 1 === stopsFilter);

    return [...result].sort((a, b) => {
      if (sortBy === 'price') return a.totalPrice - b.totalPrice;
      const byDuration = a.totalDuration - b.totalDuration;
      if (byDuration !== 0) return byDuration;
      return (a.legs.length - 1) - (b.legs.length - 1); // fewer stops first on tie
    });
  }, [itineraries, sortBy, stopsFilter]);

  if (itineraries === null) return null;

  return (
    <Box>
      {/* Sort + Filter bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2, flexWrap: 'wrap' }}>
        <SortControl value={sortBy} onChange={setSortBy} />
        <Divider orientation="vertical" flexItem />
        <StopsFilter
          value={stopsFilter}
          onChange={setStopsFilter}
          availableStops={availableStops}
        />
      </Box>

      {/* Result count */}
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        {displayed.length} itinerar{displayed.length === 1 ? 'y' : 'ies'} found
        {stopsFilter !== 'all' ? ' (filtered)' : ', sorted by ' + (sortBy === 'price' ? 'price' : 'travel time')}
      </Typography>

      {displayed.length === 0 && itineraries.length > 0 ? (
        <Alert severity="info">No itineraries match the selected filter.</Alert>
      ) : itineraries.length === 0 ? (
        <Alert severity="info">No itineraries found for this route and date.</Alert>
      ) : (
        displayed.map((it, i) => <ItineraryCard key={i} itinerary={it} />)
      )}
    </Box>
  );
}

export default ResultsPanel;
