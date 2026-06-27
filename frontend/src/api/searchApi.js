const BASE_URL = process.env.REACT_APP_API_URL || '';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function fetchAirports() {
  const response = await fetch(`${BASE_URL}/api/airports`);
  if (!response.ok) throw new ApiError(response.status, 'Failed to load airports');
  return response.json();
}

export async function searchFlights(origin, destination, date) {
  const params = new URLSearchParams({ origin, destination, date });
  const response = await fetch(`${BASE_URL}/api/search?${params}`);

  if (!response.ok) {
    const body = await response.json().catch(() => {
      throw new ApiError(response.status, 'An unexpected error occurred');
    });
    throw new ApiError(response.status, body.message || 'An unexpected error occurred');
  }

  return response.json();
}
