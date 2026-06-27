package com.spotnana.skypath.service;

import com.spotnana.skypath.exception.AirportNotFoundException;
import com.spotnana.skypath.model.Airport;
import com.spotnana.skypath.model.Flight;
import com.spotnana.skypath.model.Itinerary;
import com.spotnana.skypath.repository.FlightRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private FlightRepository flightRepository;

    private SearchService searchService;

    private static final LocalDate DATE = LocalDate.of(2024, 3, 15);

    private final Airport jfk = airport("JFK", "US", "America/New_York");
    private final Airport ord = airport("ORD", "US", "America/Chicago");
    private final Airport lax = airport("LAX", "US", "America/Los_Angeles");
    private final Airport syd = airport("SYD", "AU", "Australia/Sydney");
    private final Airport phx = airport("PHX", "US", "America/Phoenix");
    private final Airport dxb = airport("DXB", "AE", "Asia/Dubai");
    private final Airport lhr = airport("LHR", "GB", "Europe/London");
    private final Airport cdg = airport("CDG", "FR", "Europe/Paris");
    private final Airport bos = airport("BOS", "US", "America/New_York");
    private final Airport sea = airport("SEA", "US", "America/Los_Angeles");
    private final Airport dfw = airport("DFW", "US", "America/Chicago");

    @BeforeEach
    void setUp() {
        searchService = new SearchService(flightRepository, new ConnectionValidator(flightRepository));
    }

    @Test
    void directFlight_isReturned() {
        Flight direct = flight("JFK", "LAX", "2024-03-15T08:30", "2024-03-15T11:45");
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(direct));

        List<Itinerary> results = searchService.search("JFK", "LAX", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(direct);
        assertThat(results.get(0).getLayoverMinutes()).isEmpty();
    }

    @Test
    void oneStopConnection_isReturned() {
        // JFK→ORD arrives 08:30 CDT, ORD→LAX departs 09:30 CDT → 60 min domestic layover (valid)
        Flight legA = flight("JFK", "ORD", "2024-03-15T07:00", "2024-03-15T08:30");
        Flight legB = flight("ORD", "LAX", "2024-03-15T09:30", "2024-03-15T11:30");

        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getAirport("ORD")).thenReturn(ord);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(legA));
        when(flightRepository.getFlightsByOrigin("ORD")).thenReturn(List.of(legB));

        List<Itinerary> results = searchService.search("JFK", "LAX", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(legA, legB);
        assertThat(results.get(0).getLayoverMinutes()).hasSize(1);
    }

    @Test
    void noFlightsOnDate_returnsEmpty() {
        Flight wrongDate = flight("JFK", "LAX", "2024-03-16T08:30", "2024-03-16T11:45");
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(wrongDate));

        assertThat(searchService.search("JFK", "LAX", DATE)).isEmpty();
    }

    @Test
    void unknownOrigin_throwsAirportNotFoundException() {
        when(flightRepository.getAirport("XXX")).thenReturn(null);

        assertThatThrownBy(() -> searchService.search("XXX", "LAX", DATE))
                .isInstanceOf(AirportNotFoundException.class)
                .hasMessageContaining("XXX");
    }

    @Test
    void unknownDestination_throwsAirportNotFoundException() {
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("ZZZ")).thenReturn(null);

        assertThatThrownBy(() -> searchService.search("JFK", "ZZZ", DATE))
                .isInstanceOf(AirportNotFoundException.class)
                .hasMessageContaining("ZZZ");
    }

    @Test
    void sydToLax_datelineCrossing_totalDurationIsCorrect() {
        // SYD 09:00 AEDT (UTC+11) = 14 Mar 22:00 UTC; LAX 06:00 PDT (UTC-7) = 15 Mar 13:00 UTC → 900 min
        Flight direct = flight("SYD", "LAX", "2024-03-15T09:00", "2024-03-15T06:00");
        when(flightRepository.getAirport("SYD")).thenReturn(syd);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getFlightsByOrigin("SYD")).thenReturn(List.of(direct));

        List<Itinerary> results = searchService.search("SYD", "LAX", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTotalDuration()).isEqualTo(900L);
    }

    @Test
    void results_sortedByTotalDurationAscending() {
        // faster: JFK 08:00 EDT → LAX 11:00 PDT = 12:00 UTC → 18:00 UTC = 360 min
        // slower: JFK 08:00 EDT → LAX 12:00 PDT = 12:00 UTC → 19:00 UTC = 420 min
        Flight faster = flight("JFK", "LAX", "2024-03-15T08:00", "2024-03-15T11:00");
        Flight slower = flight("JFK", "LAX", "2024-03-15T08:00", "2024-03-15T12:00");

        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(slower, faster));

        List<Itinerary> results = searchService.search("JFK", "LAX", DATE);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getTotalDuration()).isLessThan(results.get(1).getTotalDuration());
    }

    // ── Spec test cases ───────────────────────────────────────────────────────

    @Test
    void tc1_jfkToLax_returnsBothDirectAndOneStop() {
        // TC#1: same search returns direct flights AND multi-stop options
        // direct: JFK→LAX dep 14:00 EDT = 18:00 UTC; arr 17:15 PDT = 00:15 UTC (+1d) → 375 min
        // 1-stop: JFK→ORD dep 07:00 EDT = 11:00 UTC; ORD→LAX arr 11:30 PDT = 18:30 UTC → 450 min
        Flight direct = flight("JFK", "LAX", "2024-03-15T14:00", "2024-03-15T17:15");
        Flight legA   = flight("JFK", "ORD", "2024-03-15T07:00", "2024-03-15T08:30");
        Flight legB   = flight("ORD", "LAX", "2024-03-15T09:30", "2024-03-15T11:30");

        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getAirport("ORD")).thenReturn(ord);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(direct, legA));
        when(flightRepository.getFlightsByOrigin("ORD")).thenReturn(List.of(legB));

        List<Itinerary> results = searchService.search("JFK", "LAX", DATE);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getLegs()).containsExactly(direct);   // shorter
        assertThat(results.get(1).getLegs()).containsExactly(legA, legB);
    }

    @Test
    void tc3_bosToSea_noDirectFlight_connectionsFound() {
        // TC#3: no direct BOS→SEA — must surface the 1-stop connection via ORD
        // legA: BOS→ORD dep 06:30 EDT = 10:30 UTC; arr 08:30 CDT = 13:30 UTC
        // legB: ORD→SEA dep 09:30 CDT = 14:30 UTC; arr 11:30 PDT = 18:30 UTC — 60 min layover (domestic)
        Flight legA = flight("BOS", "ORD", "2024-03-15T06:30", "2024-03-15T08:30");
        Flight legB = flight("ORD", "SEA", "2024-03-15T09:30", "2024-03-15T11:30");

        when(flightRepository.getAirport("BOS")).thenReturn(bos);
        when(flightRepository.getAirport("SEA")).thenReturn(sea);
        when(flightRepository.getAirport("ORD")).thenReturn(ord);
        when(flightRepository.getFlightsByOrigin("BOS")).thenReturn(List.of(legA)); // no direct to SEA
        when(flightRepository.getFlightsByOrigin("ORD")).thenReturn(List.of(legB));

        List<Itinerary> results = searchService.search("BOS", "SEA", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(legA, legB);
    }

    @Test
    void twoStopConnection_isReturned() {
        // JFK→ORD→LAX→SEA: two valid domestic connections, both ≥ 45 min
        // legA: dep 07:00 EDT = 11:00 UTC; arr 08:30 CDT = 13:30 UTC
        // legB: dep 09:30 CDT = 14:30 UTC (layover 60 min); arr 11:30 PDT = 18:30 UTC
        // legC: dep 12:30 PDT = 19:30 UTC (layover 60 min); arr 14:30 PDT = 21:30 UTC
        Flight legA = flight("JFK", "ORD", "2024-03-15T07:00", "2024-03-15T08:30");
        Flight legB = flight("ORD", "LAX", "2024-03-15T09:30", "2024-03-15T11:30");
        Flight legC = flight("LAX", "SEA", "2024-03-15T12:30", "2024-03-15T14:30");

        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("SEA")).thenReturn(sea);
        when(flightRepository.getAirport("ORD")).thenReturn(ord);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(legA));
        when(flightRepository.getFlightsByOrigin("ORD")).thenReturn(List.of(legB));
        when(flightRepository.getFlightsByOrigin("LAX")).thenReturn(List.of(legC));

        List<Itinerary> results = searchService.search("JFK", "SEA", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(legA, legB, legC);
        assertThat(results.get(0).getLayoverMinutes()).containsExactly(60L, 60L);
    }

    @Test
    void circularRoute_revisitingHub_isNotReturned() {
        // JFK→ORD→LAX→ORD: the only legC goes back to ORD (hub1) which is in the visited set.
        // Also not the search destination (SEA), so no results.
        Flight legA = flight("JFK", "ORD", "2024-03-15T07:00", "2024-03-15T08:30");
        Flight legB = flight("ORD", "LAX", "2024-03-15T09:30", "2024-03-15T11:30");
        Flight legC = flight("LAX", "ORD", "2024-03-15T13:00", "2024-03-15T18:30");

        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("SEA")).thenReturn(sea);
        when(flightRepository.getAirport("ORD")).thenReturn(ord);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(legA));
        when(flightRepository.getFlightsByOrigin("ORD")).thenReturn(List.of(legB));
        when(flightRepository.getFlightsByOrigin("LAX")).thenReturn(List.of(legC));

        assertThat(searchService.search("JFK", "SEA", DATE)).isEmpty();
    }

    @Test
    void legB_departingNextCalendarDay_isStillValid() {
        // Date filter applies only to leg A. Leg B may depart on the next calendar day.
        // legA: dep JFK 22:00 EDT = 02:00 UTC (+1d); arr ORD 23:30 CDT = 04:30 UTC (+1d)
        // legB: dep ORD 00:30 CDT (local Mar 16) = 05:30 UTC (+1d); 60-min layover at ORD → valid
        Flight legA = flight("JFK", "ORD", "2024-03-15T22:00", "2024-03-15T23:30");
        Flight legB = flight("ORD", "LAX", "2024-03-16T00:30", "2024-03-16T02:30");

        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getAirport("ORD")).thenReturn(ord);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(legA));
        when(flightRepository.getFlightsByOrigin("ORD")).thenReturn(List.of(legB));

        List<Itinerary> results = searchService.search("JFK", "LAX", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(legA, legB);
    }

    // ── Layover rule tests ────────────────────────────────────────────────────

    @Test
    void domesticLayover_lessThan45Min_isRejected() {
        // PHX→LAX→JFK — all US airports → domestic → minimum 45 min
        // legA_early arrives LAX 06:30 PDT = 13:30 UTC; legB departs 12:00 PDT = 19:00 UTC → 330 min → valid
        // legA_late  arrives LAX 11:30 PDT = 18:30 UTC; legB departs 12:00 PDT = 19:00 UTC → 30 min  → rejected
        Flight legA_early = flight("PHX", "LAX", "2024-03-15T06:00", "2024-03-15T06:30");
        Flight legA_late  = flight("PHX", "LAX", "2024-03-15T11:00", "2024-03-15T11:30");
        Flight legB       = flight("LAX", "JFK", "2024-03-15T12:00", "2024-03-15T20:30");

        when(flightRepository.getAirport("PHX")).thenReturn(phx);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getFlightsByOrigin("PHX")).thenReturn(List.of(legA_early, legA_late));
        when(flightRepository.getFlightsByOrigin("LAX")).thenReturn(List.of(legB));

        List<Itinerary> results = searchService.search("PHX", "JFK", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(legA_early, legB);
        assertThat(results.get(0).getLayoverMinutes()).containsExactly(330L);
    }

    @Test
    void internationalLayover_lessThan90Min_isRejected() {
        // DXB→LHR→CDG — crosses country borders → international → minimum 90 min
        // legA arrives LHR 06:30 UTC (UTC+0 on 15 Mar, before UK DST)
        // legB_short departs LHR 07:00 UTC → 30 min  → rejected (< 90 min)
        // legB_valid departs LHR 12:00 UTC → 330 min → valid
        Flight legA       = flight("DXB", "LHR", "2024-03-15T02:00", "2024-03-15T06:30");
        Flight legB_short = flight("LHR", "CDG", "2024-03-15T07:00", "2024-03-15T08:15");
        Flight legB_valid = flight("LHR", "CDG", "2024-03-15T12:00", "2024-03-15T13:15");

        when(flightRepository.getAirport("DXB")).thenReturn(dxb);
        when(flightRepository.getAirport("LHR")).thenReturn(lhr);
        when(flightRepository.getAirport("CDG")).thenReturn(cdg);
        when(flightRepository.getFlightsByOrigin("DXB")).thenReturn(List.of(legA));
        when(flightRepository.getFlightsByOrigin("LHR")).thenReturn(List.of(legB_short, legB_valid));

        List<Itinerary> results = searchService.search("DXB", "CDG", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(legA, legB_valid);
        assertThat(results.get(0).getLayoverMinutes()).containsExactly(330L);
    }

    @Test
    void layover_moreThan6Hours_isRejected() {
        // DXB→JFK→ORD — DXB(AE)→US connection → international → minimum 90 min, maximum 360 min
        // legA arrives JFK 09:30 EDT = 13:30 UTC
        // legB_valid   departs JFK 11:00 EDT = 15:00 UTC → 90 min  → valid (exactly at international minimum)
        // legB_toolong departs JFK 16:00 EDT = 20:00 UTC → 390 min → rejected (> 360 min max)
        Flight legA         = flight("DXB", "JFK", "2024-03-15T03:00", "2024-03-15T09:30");
        Flight legB_valid   = flight("JFK", "ORD", "2024-03-15T11:00", "2024-03-15T13:15");
        Flight legB_toolong = flight("JFK", "ORD", "2024-03-15T16:00", "2024-03-15T18:15");

        when(flightRepository.getAirport("DXB")).thenReturn(dxb);
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("ORD")).thenReturn(ord);
        when(flightRepository.getFlightsByOrigin("DXB")).thenReturn(List.of(legA));
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(legB_valid, legB_toolong));

        List<Itinerary> results = searchService.search("DXB", "ORD", DATE);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLegs()).containsExactly(legA, legB_valid);
        assertThat(results.get(0).getLayoverMinutes()).containsExactly(90L);
    }

    @Test
    void buildItinerary_nullAirportForEndpoint_isStrippedFromResults() {
        // Force getAirport("LAX") to return lax on the first call (destination validation in search())
        // then null on the second call (inside buildItinerary), simulating a corrupt dataset row
        // where a flight's endpoint code isn't in the airports map.
        Flight direct = flight("JFK", "LAX", "2024-03-15T14:00", "2024-03-15T17:15");
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax, (Airport) null);
        when(flightRepository.getFlightsByOrigin("JFK")).thenReturn(List.of(direct));

        // buildItinerary returns null; results.removeIf(Objects::isNull) strips it — no NPE
        assertThat(searchService.search("JFK", "LAX", DATE)).isEmpty();
    }

    // helpers

    private Airport airport(String code, String country, String timezone) {
        Airport a = new Airport();
        a.setCode(code);
        a.setCountry(country);
        a.setTimezone(timezone);
        return a;
    }

    private Flight flight(String origin, String dest, String dep, String arr) {
        Flight f = new Flight();
        f.setOrigin(origin);
        f.setDestination(dest);
        f.setDepartureTime(LocalDateTime.parse(dep));
        f.setArrivalTime(LocalDateTime.parse(arr));
        return f;
    }
}
