import { Card, CardContent, Box, Typography, Divider, Chip } from '@mui/material';
import FlightRow from '../FlightRow/FlightRow';
import LayoverBadge from '../LayoverBadge/LayoverBadge';

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function stopsLabel(legs) {
  const stops = legs.length - 1;
  if (stops === 0) return 'Direct';
  return stops === 1 ? '1 Stop' : `${stops} Stops`;
}

function ItineraryCard({ itinerary }) {
  const { legs, layoverMinutes, totalDuration, totalPrice } = itinerary;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              {formatDuration(totalDuration)}
            </Typography>
            <Chip label={stopsLabel(legs)} size="small" color="primary" variant="outlined" />
          </Box>
          <Typography variant="h6" fontWeight={700} color="primary">
            ${totalPrice.toFixed(0)}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {legs.map((leg, i) => (
          <Box key={`${leg.flightNumber}-${i}`}>
            <FlightRow leg={leg} />
            {i < legs.length - 1 && (
              <>
                <LayoverBadge airport={leg.destination} minutes={layoverMinutes[i]} />
                <Divider sx={{ my: 0.5 }} />
              </>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export default ItineraryCard;
