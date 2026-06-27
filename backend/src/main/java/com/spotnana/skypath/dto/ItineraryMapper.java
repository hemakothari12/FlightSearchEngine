package com.spotnana.skypath.dto;

import com.spotnana.skypath.model.Airport;
import com.spotnana.skypath.model.Flight;
import com.spotnana.skypath.model.Itinerary;
import com.spotnana.skypath.repository.FlightRepository;
import com.spotnana.skypath.util.TimeZoneUtil;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class ItineraryMapper {

    private final FlightRepository flightRepository;

    public ItineraryMapper(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    public ItineraryResponse toResponse(Itinerary itinerary) {
        List<FlightResponse> legs = itinerary.getLegs().stream()
                .map(this::toFlightResponse)
                .toList();

        long totalLayover = itinerary.getLayoverMinutes().stream()
                .mapToLong(Long::longValue)
                .sum();

        return ItineraryResponse.builder()
                .legs(legs)
                .layoverMinutes(itinerary.getLayoverMinutes())
                .totalDuration(itinerary.getTotalDuration())
                .totalPrice(itinerary.getTotalPrice())
                .stops(legs.size() - 1)
                .totalLayover(totalLayover)
                .build();
    }

    public List<ItineraryResponse> toResponseList(List<Itinerary> itineraries) {
        return itineraries.stream().map(this::toResponse).toList();
    }

    private FlightResponse toFlightResponse(Flight flight) {
        Airport originAirport = flightRepository.getAirport(flight.getOrigin());
        Airport destAirport = flightRepository.getAirport(flight.getDestination());
        Instant dep = TimeZoneUtil.toUtcInstant(flight.getDepartureTime(), originAirport.getTimezone());
        Instant arr = TimeZoneUtil.toUtcInstant(flight.getArrivalTime(), destAirport.getTimezone());

        return FlightResponse.builder()
                .flightNumber(flight.getFlightNumber())
                .airline(flight.getAirline())
                .origin(flight.getOrigin())
                .destination(flight.getDestination())
                .departureTime(flight.getDepartureTime())
                .arrivalTime(flight.getArrivalTime())
                .price(flight.getPrice())
                .aircraft(flight.getAircraft())
                .durationMinutes(TimeZoneUtil.minutesBetween(dep, arr))
                .build();
    }
}
