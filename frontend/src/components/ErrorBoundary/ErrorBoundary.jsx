import { Component } from 'react';
import { Box, Alert, AlertTitle, Button, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'An unexpected error occurred.' };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6, px: 2 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          }
        >
          <AlertTitle>Something went wrong</AlertTitle>
          <Typography variant="body2">{this.state.message}</Typography>
        </Alert>
      </Box>
    );
  }
}

export default ErrorBoundary;
