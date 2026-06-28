# SkyPath — Flight Connection Search Engine

A full-stack prototype flight search engine. Users enter an origin, destination, and date to find valid direct and multi-stop itineraries across a dataset of ~260 flights covering 25 airports worldwide.

---

## Running the Application

### Option 1 — Docker (recommended)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

These three commands are all you need — Docker builds and starts **both** the backend and frontend together:

```bash
git clone <your-repo-url>
cd FlightSearchEngine
docker-compose up --build
```

Once both containers are running, open [http://localhost:3000](http://localhost:3000).

> The frontend container proxies all `/api/*` requests to the backend via Nginx — no separate backend URL needed.

To stop:
```bash
docker-compose down
```

---

### Option 2 — Without Docker (local dev)

**Prerequisites:**
- Java 17 or higher (`java -version`)
- Maven 3.8 or higher (`mvn -version`)
- Node.js 18 or higher + npm (`node -version`, `npm -version`)

```bash
git clone <your-repo-url>
cd FlightSearchEngine
```

**Terminal 1 — start the backend:**
```bash
cd backend
mvn spring-boot:run
```
Wait until you see `Started SkyPathApplication` in the logs — the backend is ready on `http://localhost:8080`.

**Terminal 2 — start the frontend:**
```bash
cd frontend
REACT_APP_API_URL=http://localhost:8080 npm install
REACT_APP_API_URL=http://localhost:8080 npm start
```
The browser opens automatically at [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Java 17, Spring Boot 3, Maven |
| Frontend | React 18, Material UI |
| Infrastructure | Docker, docker-compose, Nginx |
| Backend tests | JUnit 5, Mockito, Spring MockMvc |
| Frontend tests | React Testing Library, Jest |

---

## Architecture Decisions

### Why in-memory storage (no database)

The dataset is static — 260 flights loaded from `flights.json` at startup. A relational database would add deployment complexity, connection pooling, and schema migration overhead for no benefit. The in-memory `FlightRepository` builds two lookup maps at startup:

- `Map<String, Airport>` keyed by IATA code
- `Map<String, List<Flight>>` keyed by origin code (adjacency list)

This gives O(1) airport lookup and O(n) per-origin flight scans — fast enough for any realistic query against this dataset.

### Why BFS / bounded graph search

Flight connections form a directed graph with airports as nodes and flights as edges. The search performs a bounded BFS up to depth 3 (direct, 1-stop, 2-stop), explicitly collecting all valid paths rather than finding a single shortest path. This is correct because:

- We need **all** valid itineraries, not just one.
- The depth limit (max 2 stops) bounds the search space to at most O(F³) in the worst case, where F is the max number of flights from any one airport — manageable for this dataset.
- A pre-filter (`candidatesInWindow`) eliminates flights outside the 6-hour layover window before the full `ConnectionValidator` runs, reducing inner-loop iterations significantly.

### How timezone handling works

All times in `flights.json` are local airport time. To compare times correctly across timezones:

1. Each airport carries an IANA timezone string (e.g. `America/New_York`).
2. `TimeZoneUtil.toUtcInstant(localDateTime, ianaTimezone)` converts to a UTC `Instant` using `java.time.ZoneId`.
3. All duration and layover calculations use UTC instants exclusively.

This handles dateline crossings (e.g. SYD→LAX, where local arrival appears "before" departure) and DST transitions automatically — no special-casing needed.

### Why the date filter applies only to Leg 1

The search filters Leg 1 departures to the user-requested date in local airport time. Legs 2 and 3 are validated purely by UTC chronology and layover window. This is intentional: a long layover or a timezone shift can push a connecting flight to the next calendar day, which is valid behavior the spec supports.

### Backend package structure

Each package has a single, named responsibility:

| Package | Class(es) | Role |
|---|---|---|
| `controller/` | `SearchController` | HTTP boundary — validates request params, delegates to service, returns response |
| `service/` | `SearchService` | Graph traversal and itinerary assembly |
| `service/` | `ConnectionValidator` | Layover rule enforcement (min/max, domestic vs international) |
| `repository/` | `FlightRepository` | Loads `flights.json` at startup; exposes O(1) airport lookup and per-origin flight lists |
| `model/` | `Airport`, `Flight`, `Itinerary` | Plain domain objects — no business logic |
| `dto/` | `ItineraryResponse`, `FlightResponse`, `ItineraryMapper` | Translates internal models to the API response shape |
| `exception/` | `AirportNotFoundException`, `InvalidInputException`, `GlobalExceptionHandler` | Consistent error JSON for all failure modes |
| `util/` | `TimeZoneUtil` | Pure UTC conversion and duration math |
| `config/` | `CorsConfig` | CORS policy allowing the frontend origin |

### Backend design principles

**Single responsibility**
Each class has exactly one job. `SearchController` handles HTTP, `SearchService` runs the graph search, `ConnectionValidator` enforces layover rules, `FlightRepository` owns data loading, `ItineraryMapper` owns serialisation shape, `TimeZoneUtil` does UTC math. No class does two of these jobs.

**Open/closed**
Business rules (minimum layover times, maximum layover, domestic classification) are centralised in `ConnectionValidator`. Adding a new rule — for example a minimum connection time per airline — means extending `ConnectionValidator`, not editing `SearchService`.

**Dependency inversion**
All Spring-managed classes depend on abstractions injected via constructor, not on concrete implementations resolved inline. Every class is independently testable with a mock or stub without a Spring context.

**Separation of concerns: DTO layer**
Internal model classes (`Itinerary`, `Flight`) are decoupled from the API response shape. `ItineraryMapper` translates between them, so internal refactors don't break the API contract and the response shape can evolve without touching domain logic.

**Fail-fast validation**
Input validation (IATA format, same-origin check, date parse) happens at the controller boundary before any service call. Unknown airport codes throw `AirportNotFoundException` at the top of `SearchService.search()`. Invalid inputs never reach the algorithm.

---

### Frontend component design

Each UI element is its own component with a single responsibility:

> **Note on airport input:** The spec calls for a plain 3-letter IATA code input. The implementation goes further with a full-text autocomplete that searches by airport name, city, country, and code — so a user can type "New York" or "Kennedy" and select JFK, rather than having to know the code in advance. The selected value is still resolved to a 3-letter IATA code before being sent to the backend, so all backend validation and business rules are unchanged.

| Component | Role |
|---|---|
| `AirportAutocomplete` | Searchable airport dropdown with code/name/city filtering |
| `SearchForm` | Form state, validation, submit |
| `SearchDatePicker` | Date input |
| `ResultsPanel` | Sort/filter bar + result list |
| `ItineraryCard` | Collapsible summary + per-segment detail |
| `FlightRow` | One flight segment row |
| `LayoverBadge` | Layover duration chip between segments |
| `SortControl` | Duration / price sort toggle |
| `StopsFilter` | Filter by number of stops |
| `ErrorBoundary` | Catches unexpected render errors in the results area |

---

## Key Business Rules Implemented

| Rule | Value |
|---|---|
| Min layover — domestic | 45 min |
| Min layover — international | 90 min |
| Max layover | 6 hours |
| Max stops | 2 |
| Airport change during layover | Not allowed |
| Domestic definition | Inbound origin, hub, and outbound destination must all share the same country |

---

## Test Cases

All six spec test cases pass end-to-end:

| # | Search | Expected |
|---|--------|----------|
| 1 | `JFK → LAX, 2024-03-15` | Direct flights and multi-stop options returned |
| 2 | `SFO → NRT, 2024-03-15` | International route — 90-min minimum layover enforced |
| 3 | `BOS → SEA, 2024-03-15` | No direct flight — connections found |
| 4 | `JFK → JFK, 2024-03-15` | 400 error — origin and destination must differ |
| 5 | `XXX → LAX, 2024-03-15` | 404 error — unknown airport code |
| 6 | `SYD → LAX, 2024-03-15` | Dateline crossing — UTC math resolves correctly |

---

## Assumptions

1. **Static dataset.** All flights are on `2024-03-15` (with some overnight arrivals on `2024-03-16`). No real-time data or live inventory.
2. **No seat availability.** Every flight shown is assumed bookable; the dataset carries no capacity field.
3. **Flat pricing.** Prices in `flights.json` are used as-is — no taxes, fees, or dynamic pricing applied.
4. **Same-airport layover only.** The IATA code of the inbound flight's destination must exactly match the outbound flight's origin. Terminal transfers within one airport are not modeled.
5. **Domestic classification uses all three airports.** A connection is domestic only when the inbound origin, the hub, and the outbound destination are all in the same country. A flight arriving domestically but departing internationally is classified as international.
6. **Date filter on Leg 1 only.** Legs 2 and 3 may depart on a different calendar day due to overnight layovers or timezone crossings; they are validated by UTC window, not by date.
7. **Up to 2 stops.** The spec caps connections at 2 intermediate airports; deeper paths are not explored.
8. **Cycle-free paths.** The search skips any path that revisits an airport already in the itinerary (e.g. JFK→LAX→JFK→SEA is rejected).
9. **One-way trips only.** The spec describes single-direction itineraries. Round-trip and multi-city searches are not supported; each search is an independent one-way query.
10. **Past dates are selectable; date picker defaults to the dataset date.** The dataset covers flights on `2024-03-15` — a historical date. The date picker intentionally does not restrict to future dates so the dataset can be queried as intended. It also defaults to `2024-03-15` so first-time users can run a search immediately without having to find a valid date themselves.
11. **Page refresh resets to empty state.** The spec does not define refresh behavior. The implementation holds all search state in React component memory — no URL parameters, localStorage, or session storage are used. Refreshing the page discards any previous search and returns to the initial blank form.
12. **No pagination required.** The bounded search (max 2 stops across 260 flights) produces a manageable result set per query. All matching itineraries are returned in a single response without paging.

---

## Tradeoffs

### In-memory vs database

In-memory is the right call for a static 260-flight dataset. The tradeoff is that scaling to millions of flights, real-time schedule updates, or multi-instance deployments would require an external store (PostgreSQL, Elasticsearch for full-text airport search, Redis for caching). The repository abstraction (`FlightRepository`) means the storage layer can be swapped without touching the service or controller.

### BFS depth-limited search vs Dijkstra / A*

BFS collecting all valid paths is simple and correct for depth ≤ 3. Dijkstra would find the single shortest path faster, but we need the full result set for the user to browse, sort, and filter. With the 6-hour window pre-filter, the inner loops rarely iterate over more than a handful of candidates per hub.

### UTC-at-query-time vs pre-computed UTC fields

UTC instants are computed on each search call using `ZoneId.of()` — not free. For this dataset size the overhead is negligible. The natural optimisation for a larger dataset is to precompute `departureUtc` / `arrivalUtc` at load time and cache them on the `Flight` object, eliminating repeated timezone lookups from the hot loop.

---

## What I Would Improve With More Time

- **Deeper sort criteria.** The current sort offers two options — duration (with stops as a tiebreaker) and price. A more complete implementation would support multi-level sorting within each option: for example, price sort could fall back to duration then stops; duration sort could fall back to price then airline preference. A production system would also expose user-configurable sort priorities.
- **Result caching.** Identical queries (same origin, destination, date) could be served from a Redis cache with a short TTL, avoiding repeated graph traversal on popular routes.
- **Pagination.** For larger datasets, returning an unbounded list is impractical. Cursor-based pagination on the API and virtual scrolling on the frontend would be needed.
- **Round-trip / multi-city search.** The current model handles one-way itineraries only.
- **Visual flight path.** A horizontal timeline (origin ●———●———● destination) in the itinerary summary row would communicate route structure more intuitively than text descriptions.
- **Accessibility audit.** ARIA labels on sort/filter controls and screen-reader announcements for result updates could be strengthened.
- **Mobile layout.** The form and itinerary cards are functional on small screens but not optimised for mobile viewports.
