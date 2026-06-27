import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../../components/ErrorBoundary/ErrorBoundary';

function Bomb({ shouldThrow, message = 'Test explosion' }) {
  if (shouldThrow) throw new Error(message);
  return <div>Safe content</div>;
}

function BombNoMessage() {
  // eslint-disable-next-line no-throw-literal
  throw new Error();
}

describe('ErrorBoundary', () => {
  let consoleError;
  beforeEach(() => {
    // React logs expected boundary errors to console — suppress them in test output
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  test('catches render error and shows fallback heading', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('displays the thrown error message in the fallback', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow message="Unexpected null reference" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Unexpected null reference')).toBeInTheDocument();
  });

  test('shows generic message when error has no message', () => {
    render(
      <ErrorBoundary>
        <BombNoMessage />
      </ErrorBoundary>
    );
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  test('shows Reload button in fallback UI', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  test('Reload button calls window.location.reload', () => {
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    userEvent.click(screen.getByRole('button', { name: /reload/i }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
