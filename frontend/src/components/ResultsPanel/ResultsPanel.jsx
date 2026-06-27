import { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Alert, Divider } from '@mui/material';
import ItineraryCard from '../ItineraryCard/ItineraryCard';
import SortControl from '../SortControl/SortControl';
import StopsFilter from '../StopsFilter/StopsFilter';

function cardKey(it) {
  return it.legs.map((l) => l.flightNumber).join('-');
}

function renderCards(itineraries, displayed) {
  if (itineraries.length === 0) {
    return <Alert severity="info">No itineraries found for this route and date.</Alert>;
  }
  if (displayed.length === 0) {
    return <Alert severity="info">No itineraries match the selected filter.</Alert>;
  }
  return displayed.map((it) => <ItineraryCard key={cardKey(it)} itinerary={it} />);
}

function ResultsPanel({ itineraries }) {
  const [sortBy, setSortBy] = useState('duration');
  const [stopsFilter, setStopsFilter] = useState('all');

  useEffect(() => {
    setSortBy('duration');
    setStopsFilter('all');
  }, [itineraries]);

  const availableStops = useMemo(() => {
    if (!itineraries) return new Set();
    return new Set(itineraries.map((it) => it.stops));
  }, [itineraries]);

  const displayed = useMemo(() => {
    if (!itineraries) return [];

    let result = stopsFilter === 'all'
      ? itineraries
      : itineraries.filter((it) => it.stops === stopsFilter);

    return [...result].sort((a, b) => {
      if (sortBy === 'price') return a.totalPrice - b.totalPrice;
      const byDuration = a.totalDuration - b.totalDuration;
      if (byDuration !== 0) return byDuration;
      return a.stops - b.stops;
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

      {renderCards(itineraries, displayed)}
    </Box>
  );
}

export default ResultsPanel;
