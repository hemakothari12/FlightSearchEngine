package com.spotnana.skypath.dto;

import com.spotnana.skypath.model.Flight;
import com.spotnana.skypath.model.Itinerary;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ItineraryMapperTest {

    private final ItineraryMapper mapper = new ItineraryMapper();

    @Test
    void toResponse_directFlight_mapsAllFieldsCorrectly() {
        Flight leg = flight("SP101", "SkyPath Airways", "JFK", "LAX", 299.0, "A320");
        Itinerary it = new Itinerary(List.of(leg), List.of(), 375L, 299.0);

        ItineraryResponse response = mapper.toResponse(it);

        assertThat(response.getStops()).isEqualTo(0);
        assertThat(response.getTotalDuration()).isEqualTo(375L);
        assertThat(response.getTotalPrice()).isEqualTo(299.0);
        assertThat(response.getTotalLayover()).isEqualTo(0L);
        assertThat(response.getLayoverMinutes()).isEmpty();
        assertThat(response.getLegs()).hasSize(1);

        FlightResponse legResp = response.getLegs().get(0);
        assertThat(legResp.getFlightNumber()).isEqualTo("SP101");
        assertThat(legResp.getAirline()).isEqualTo("SkyPath Airways");
        assertThat(legResp.getOrigin()).isEqualTo("JFK");
        assertThat(legResp.getDestination()).isEqualTo("LAX");
        assertThat(legResp.getPrice()).isEqualTo(299.0);
        assertThat(legResp.getAircraft()).isEqualTo("A320");
        assertThat(legResp.getDepartureTime()).isEqualTo(LocalDateTime.of(2024, 3, 15, 8, 30));
        assertThat(legResp.getArrivalTime()).isEqualTo(LocalDateTime.of(2024, 3, 15, 11, 45));
    }

    @Test
    void toResponse_oneStopItinerary_computesStopsAndTotalLayover() {
        Flight legA = flight("SP201", "SkyPath Airways", "JFK", "ORD", 199.0, "B737");
        Flight legB = flight("SP202", "SkyPath Airways", "ORD", "LAX", 179.0, "A321");
        Itinerary it = new Itinerary(List.of(legA, legB), List.of(60L), 270L, 378.0);

        ItineraryResponse response = mapper.toResponse(it);

        assertThat(response.getStops()).isEqualTo(1);
        assertThat(response.getTotalLayover()).isEqualTo(60L);
        assertThat(response.getLayoverMinutes()).containsExactly(60L);
        assertThat(response.getLegs()).hasSize(2);
    }

    @Test
    void toResponse_twoStopItinerary_computesStopsAndSummedTotalLayover() {
        Flight legA = flight("SP301", "SkyPath Airways", "JFK", "ORD", 150.0, "A319");
        Flight legB = flight("SP302", "SkyPath Airways", "ORD", "LAX", 150.0, "A320");
        Flight legC = flight("SP303", "SkyPath Airways", "LAX", "SFO", 100.0, "B737");
        Itinerary it = new Itinerary(List.of(legA, legB, legC), List.of(60L, 90L), 450L, 400.0);

        ItineraryResponse response = mapper.toResponse(it);

        assertThat(response.getStops()).isEqualTo(2);
        assertThat(response.getTotalLayover()).isEqualTo(150L);
        assertThat(response.getLayoverMinutes()).containsExactly(60L, 90L);
    }

    @Test
    void toResponseList_mapsAllItinerariesPreservingOrder() {
        Flight leg = flight("SP101", "SkyPath Airways", "JFK", "LAX", 299.0, "A320");
        Itinerary fast = new Itinerary(List.of(leg), List.of(), 375L, 299.0);
        Itinerary slow = new Itinerary(List.of(leg), List.of(), 420L, 199.0);

        List<ItineraryResponse> responses = mapper.toResponseList(List.of(fast, slow));

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getTotalDuration()).isEqualTo(375L);
        assertThat(responses.get(1).getTotalDuration()).isEqualTo(420L);
    }

    @Test
    void toResponseList_emptyList_returnsEmptyList() {
        assertThat(mapper.toResponseList(List.of())).isEmpty();
    }

    private Flight flight(String number, String airline, String origin, String dest, double price, String aircraft) {
        Flight f = new Flight();
        f.setFlightNumber(number);
        f.setAirline(airline);
        f.setOrigin(origin);
        f.setDestination(dest);
        f.setPrice(price);
        f.setAircraft(aircraft);
        f.setDepartureTime(LocalDateTime.of(2024, 3, 15, 8, 30));
        f.setArrivalTime(LocalDateTime.of(2024, 3, 15, 11, 45));
        return f;
    }
}
