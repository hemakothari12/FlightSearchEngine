import { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, CircularProgress,
  Alert, createTheme, ThemeProvider, CssBaseline,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FlightIcon from '@mui/icons-material/Flight';
import SearchForm from './components/SearchForm/SearchForm';
import ResultsPanel from './components/ResultsPanel/ResultsPanel';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { fetchAirports, searchFlights } from './api/searchApi';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    background: { default: '#f5f7fa' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
});

function App() {
  const [airports, setAirports] = useState([]);
  const [airportLoadError, setAirportLoadError] = useState(false);
  const [itineraries, setItineraries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAirports()
      .then((data) => setAirports([...data].sort((a, b) => a.code.localeCompare(b.code))))
      .catch(() => setAirportLoadError(true));
  }, []);

  async function handleSearch(origin, destination, date) {
    setLoading(true);
    setError(null);
    setItineraries(null);
    try {
      const results = await searchFlights(origin, destination, date);
      setItineraries(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <FlightIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={700} letterSpacing={1}>
              SkyPath
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Find Flights
            </Typography>
            {airportLoadError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Couldn't load the airports list.
              </Alert>
            )}
            <SearchForm onSearch={handleSearch} loading={loading} airports={airports} />
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <CircularProgress size={48} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <ErrorBoundary>
            <ResultsPanel itineraries={itineraries} />
          </ErrorBoundary>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
