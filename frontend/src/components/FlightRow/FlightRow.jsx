import { Box, Typography } from '@mui/material';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';

function formatTime(dateTimeStr) {
  return dateTimeStr ? dateTimeStr.substring(11, 16) : '';
}

function FlightRow({ leg }) {
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
      <Typography variant="body2" color="text.secondary">
        {formatTime(leg.departureTime)} → {formatTime(leg.arrivalTime)}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {leg.destination}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        · {leg.aircraft}
      </Typography>
    </Box>
  );
}

export default FlightRow;
