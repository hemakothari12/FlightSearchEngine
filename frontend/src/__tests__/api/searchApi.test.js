import { fetchAirports, searchFlights, ApiError } from '../../api/searchApi';

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('fetchAirports', () => {
  test('returns parsed JSON on success', async () => {
    const data = [{ code: 'JFK', name: 'Kennedy', city: 'New York', country: 'US' }];
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });
    await expect(fetchAirports()).resolves.toEqual(data);
  });

  test('throws ApiError with status 503 on non-ok response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchAirports()).rejects.toMatchObject({
      status: 503,
      message: 'Failed to load airports',
    });
  });

  test('thrown error is an instance of ApiError', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchAirports()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('searchFlights', () => {
  test('returns parsed JSON on success', async () => {
    const data = [{ legs: [], totalDuration: 375 }];
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });
    await expect(searchFlights('JFK', 'LAX', '2024-03-15')).resolves.toEqual(data);
  });

  test('builds correct query params', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await searchFlights('JFK', 'LAX', '2024-03-15');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('origin=JFK')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('destination=LAX')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('date=2024-03-15')
    );
  });

  test('throws ApiError with body message on non-ok response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Unknown airport code: XXX' }),
    });
    await expect(searchFlights('XXX', 'LAX', '2024-03-15')).rejects.toMatchObject({
      status: 404,
      message: 'Unknown airport code: XXX',
    });
  });

  test('falls back to generic message when body has no message field', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });
    await expect(searchFlights('JFK', 'LAX', '2024-03-15')).rejects.toMatchObject({
      message: 'An unexpected error occurred',
    });
  });

  test('falls back to generic message when body JSON parse fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });
    await expect(searchFlights('JFK', 'LAX', '2024-03-15')).rejects.toMatchObject({
      message: 'An unexpected error occurred',
    });
  });
});
