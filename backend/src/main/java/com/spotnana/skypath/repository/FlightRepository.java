package com.spotnana.skypath.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spotnana.skypath.model.Airport;
import com.spotnana.skypath.model.Flight;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;

@Component
public class FlightRepository {

    private static final Logger log = LoggerFactory.getLogger(FlightRepository.class);

    private final ObjectMapper objectMapper;

    @Value("${app.flights-path}")
    private Resource flightsResource;

    private final Map<String, Airport> airportsByCode = new HashMap<>();
    private final Map<String, List<Flight>> flightsByOrigin = new HashMap<>();

    public FlightRepository(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void load() throws Exception {
        InputStream is = flightsResource.getInputStream();
        JsonNode root = objectMapper.readTree(is);

        for (JsonNode node : root.get("airports")) {
            Airport airport = objectMapper.treeToValue(node, Airport.class);
            airportsByCode.put(airport.getCode(), airport);
        }

        for (JsonNode node : root.get("flights")) {
            Flight flight = objectMapper.treeToValue(node, Flight.class);
            flightsByOrigin
                .computeIfAbsent(flight.getOrigin(), k -> new ArrayList<>())
                .add(flight);
        }

        int totalFlights = flightsByOrigin.values().stream().mapToInt(List::size).sum();
        log.info("Loaded {} airports, {} flights", airportsByCode.size(), totalFlights);
    }

    public Airport getAirport(String code) {
        return airportsByCode.get(code);
    }

    public List<Flight> getFlightsByOrigin(String code) {
        return flightsByOrigin.getOrDefault(code, Collections.emptyList());
    }

    public Collection<Airport> getAllAirports() {
        return Collections.unmodifiableCollection(airportsByCode.values());
    }
}
