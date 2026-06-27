package com.spotnana.skypath.service;

import com.spotnana.skypath.model.Airport;
import com.spotnana.skypath.model.Flight;
import com.spotnana.skypath.repository.FlightRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConnectionValidatorTest {

    @Mock
    private FlightRepository flightRepository;

    private ConnectionValidator validator;

    private final Airport jfk = airport("JFK", "US", "America/New_York");
    private final Airport ord = airport("ORD", "US", "America/Chicago");
    private final Airport lax = airport("LAX", "US", "America/Los_Angeles");
    private final Airport lhr = airport("LHR", "GB", "Europe/London");
    private final Airport nrt = airport("NRT", "JP", "Asia/Tokyo");

    @BeforeEach
    void setUp() {
        validator = new ConnectionValidator(flightRepository);
    }

    @Test
    void domestic_exactlyAt45min_isValid() {
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);

        // ORD is CDT (UTC-5) on March 15 — arrive 10:00 CDT = 15:00 UTC, depart 10:45 CDT = 15:45 UTC → 45 min
        Flight inbound = flight("JFK", "ORD", "2024-03-15T08:00", "2024-03-15T10:00");
        Flight outbound = flight("ORD", "LAX", "2024-03-15T10:45", "2024-03-15T12:45");

        assertThat(validator.isValidConnection(inbound, outbound, ord))
                .isPresent().contains(45L);
    }

    @Test
    void domestic_44min_isRejected() {
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("LAX")).thenReturn(lax);

        Flight inbound = flight("JFK", "ORD", "2024-03-15T08:00", "2024-03-15T10:00");
        Flight outbound = flight("ORD", "LAX", "2024-03-15T10:44", "2024-03-15T12:44");

        assertThat(validator.isValidConnection(inbound, outbound, ord)).isEmpty();
    }

    @Test
    void international_exactlyAt90min_isValid() {
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("NRT")).thenReturn(nrt);

        // LHR is GMT (UTC+0) on March 15 (BST starts March 31) — arrive 10:00 = 10:00 UTC, depart 11:30 = 11:30 UTC → 90 min
        Flight inbound = flight("JFK", "LHR", "2024-03-15T05:00", "2024-03-15T10:00");
        Flight outbound = flight("LHR", "NRT", "2024-03-15T11:30", "2024-03-16T08:00");

        assertThat(validator.isValidConnection(inbound, outbound, lhr))
                .isPresent().contains(90L);
    }

    @Test
    void international_89min_isRejected() {
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("NRT")).thenReturn(nrt);

        Flight inbound = flight("JFK", "LHR", "2024-03-15T05:00", "2024-03-15T10:00");
        Flight outbound = flight("LHR", "NRT", "2024-03-15T11:29", "2024-03-16T08:00");

        assertThat(validator.isValidConnection(inbound, outbound, lhr)).isEmpty();
    }

    @Test
    void layoverOver6h_isRejected() {
        // isDomestic() is never reached when layover > MAX — no airport stubs needed
        Flight inbound = flight("JFK", "ORD", "2024-03-15T08:00", "2024-03-15T10:00");
        Flight outbound = flight("ORD", "LAX", "2024-03-15T16:01", "2024-03-15T18:01");

        assertThat(validator.isValidConnection(inbound, outbound, ord)).isEmpty();
    }

    @Test
    void airportMismatch_isRejected() {
        // inbound arrives at ORD, outbound departs from LAX — not the same airport
        Flight inbound = flight("JFK", "ORD", "2024-03-15T08:00", "2024-03-15T10:00");
        Flight outbound = flight("LAX", "NRT", "2024-03-15T12:00", "2024-03-16T14:00");

        assertThat(validator.isValidConnection(inbound, outbound, ord)).isEmpty();
    }

    @Test
    void mixedCountries_treatedAsInternational() {
        when(flightRepository.getAirport("JFK")).thenReturn(jfk);
        when(flightRepository.getAirport("NRT")).thenReturn(nrt);

        // 80 min at LHR — would pass domestic (45) but not international (90) → rejected
        Flight inbound = flight("JFK", "LHR", "2024-03-15T05:00", "2024-03-15T10:00");
        Flight outbound = flight("LHR", "NRT", "2024-03-15T11:20", "2024-03-16T08:00");

        assertThat(validator.isValidConnection(inbound, outbound, lhr)).isEmpty();
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
