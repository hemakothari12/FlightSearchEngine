import { Box, Typography } from '@mui/material';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';

function formatTime(dateTimeStr) {
  return dateTimeStr ? dateTimeStr.substring(11, 16) : '';
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function FlightRow({ leg }) {
  const nextDay = leg.arrivalTime && leg.departureTime &&
    leg.arrivalTime.substring(0, 10) > leg.departureTime.substring(0, 10);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, flexWrap: 'wrap' }}>
      <AirplaneTicketIcon fontSize="small" color="action" />
      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60 }}>
        {leg.flightNumber}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        {leg.airline}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {leg.origin}
      </Typography>
      <Typography variant="body2" color="text.secondary" component="span">
        {formatTime(leg.departureTime)} → {formatTime(leg.arrivalTime)}
        {nextDay && (
          <Typography component="sup" sx={{ fontSize: 10, ml: 0.3, verticalAlign: 'super' }}>
            +1
          </Typography>
        )}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {leg.destination}
      </Typography>
      {leg.durationMinutes > 0 && (
        <Typography variant="body2" color="text.secondary">
          · {formatDuration(leg.durationMinutes)}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        · {leg.aircraft}
      </Typography>
    </Box>
  );
}

export default FlightRow;
