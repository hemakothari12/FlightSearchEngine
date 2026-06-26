package com.spotnana.skypath.service;

import com.spotnana.skypath.exception.AirportNotFoundException;
import com.spotnana.skypath.model.Airport;
import com.spotnana.skypath.model.Flight;
import com.spotnana.skypath.model.Itinerary;
import com.spotnana.skypath.repository.FlightRepository;
import com.spotnana.skypath.util.TimeZoneUtil;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class SearchService {

    private final FlightRepository flightRepository;
    private final ConnectionValidator connectionValidator;

    public SearchService(FlightRepository flightRepository, ConnectionValidator connectionValidator) {
        this.flightRepository = flightRepository;
        this.connectionValidator = connectionValidator;
    }

    public List<Itinerary> search(String origin, String destination, LocalDate date) {
        Airport originAirport = flightRepository.getAirport(origin);
        Airport destAirport = flightRepository.getAirport(destination);

        if (originAirport == null) throw new AirportNotFoundException(origin);
        if (destAirport == null) throw new AirportNotFoundException(destination);

        List<Itinerary> results = new ArrayList<>();

        List<Flight> leg1Candidates = flightRepository.getFlightsByOrigin(origin).stream()
                .filter(f -> f.getDepartureTime().toLocalDate().equals(date))
                .toList();

        for (Flight legA : leg1Candidates) {
            // direct
            if (legA.getDestination().equals(destination)) {
                results.add(buildItinerary(List.of(legA), List.of()));
                continue;
            }

            Airport hub1 = flightRepository.getAirport(legA.getDestination());
            if (hub1 == null) continue;

            for (Flight legB : flightRepository.getFlightsByOrigin(legA.getDestination())) {
                Optional<Long> layoverAB = connectionValidator.isValidConnection(legA, legB, hub1);
                if (layoverAB.isEmpty()) continue;

                // 1-stop
                if (legB.getDestination().equals(destination)) {
                    results.add(buildItinerary(List.of(legA, legB), List.of(layoverAB.get())));
                    continue;
                }

                // 2-stop
                Airport hub2 = flightRepository.getAirport(legB.getDestination());
                if (hub2 == null) continue;

                Set<String> visited = new HashSet<>(List.of(origin, legA.getDestination(), legB.getDestination()));

                for (Flight legC : flightRepository.getFlightsByOrigin(legB.getDestination())) {
                    if (visited.contains(legC.getDestination())) continue;
                    if (!legC.getDestination().equals(destination)) continue;

                    Optional<Long> layoverBC = connectionValidator.isValidConnection(legB, legC, hub2);
                    if (layoverBC.isEmpty()) continue;

                    results.add(buildItinerary(
                            List.of(legA, legB, legC),
                            List.of(layoverAB.get(), layoverBC.get())));
                }
            }
        }

        results.sort(Comparator.comparingLong(Itinerary::getTotalDuration));
        return results;
    }

    private Itinerary buildItinerary(List<Flight> legs, List<Long> layovers) {
        Flight first = legs.get(0);
        Flight last = legs.get(legs.size() - 1);

        Airport originAirport = flightRepository.getAirport(first.getOrigin());
        Airport destAirport = flightRepository.getAirport(last.getDestination());

        Instant departure = TimeZoneUtil.toUtcInstant(first.getDepartureTime(), originAirport.getTimezone());
        Instant arrival = TimeZoneUtil.toUtcInstant(last.getArrivalTime(), destAirport.getTimezone());

        long totalDuration = TimeZoneUtil.minutesBetween(departure, arrival);
        double totalPrice = legs.stream().mapToDouble(Flight::getPrice).sum();

        return new Itinerary(legs, layovers, totalDuration, totalPrice);
    }
}
