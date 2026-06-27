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
