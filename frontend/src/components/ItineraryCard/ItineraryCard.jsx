import { useState } from 'react';
import {
  Card, CardContent, Box, Typography, Divider,
  IconButton, Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightRow from '../FlightRow/FlightRow';
import LayoverBadge from '../LayoverBadge/LayoverBadge';

function formatTime(dateTimeStr) {
  return dateTimeStr ? dateTimeStr.substring(11, 16) : '';
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ItineraryCard({ itinerary }) {
  const { legs, layoverMinutes, totalDuration, totalPrice } = itinerary;
  const [expanded, setExpanded] = useState(false);

  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];

  const depTime = formatTime(firstLeg.departureTime);
  const arrTime = formatTime(lastLeg.arrivalTime);

  const depDate = firstLeg.departureTime.substring(0, 10);
  const arrDate = lastLeg.arrivalTime.substring(0, 10);
  const nextDay = arrDate > depDate;

  const stops = legs.length - 1;
  const airlines = [...new Set(legs.map((l) => l.airline))].join(', ');

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: expanded ? 1 : 2 } }}>
        {/* Summary row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>

          <FlightTakeoffIcon color="primary" />

          {/* Times + Airline */}
          <Box sx={{ minWidth: 170 }}>
            <Typography variant="h6" fontWeight={700} component="div">
              {depTime} — {arrTime}
              {nextDay && (
                <Typography component="sup" sx={{ fontSize: 11, ml: 0.5, verticalAlign: 'super' }}>
                  +1
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">{airlines}</Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Duration + Route */}
          <Box sx={{ minWidth: 110 }}>
            <Typography variant="body1" fontWeight={600}>{formatDuration(totalDuration)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {firstLeg.origin}–{lastLeg.destination}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Stops + Layover */}
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="body1" fontWeight={600}>
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </Typography>
            {layoverMinutes.map((mins, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                Layover at {legs[i].destination}: {formatDuration(mins)}
              </Typography>
            ))}
          </Box>

          {/* Price + expand toggle */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={700} color="primary">
              ${totalPrice.toFixed(0)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? 'collapse flight details' : 'expand flight details'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

        </Box>

        {/* Expanded leg details */}
        <Collapse in={expanded} unmountOnExit>
          <Divider sx={{ mt: 2, mb: 1 }} />
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
        </Collapse>

      </CardContent>
    </Card>
  );
}

export default ItineraryCard;
