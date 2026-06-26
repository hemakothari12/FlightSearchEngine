package com.spotnana.skypath.service;

import com.spotnana.skypath.model.Airport;
import com.spotnana.skypath.model.Flight;
import com.spotnana.skypath.repository.FlightRepository;
import com.spotnana.skypath.util.TimeZoneUtil;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

@Component
public class ConnectionValidator {

    private static final long MIN_DOMESTIC_MINUTES = 45;
    private static final long MIN_INTERNATIONAL_MINUTES = 90;
    private static final long MAX_LAYOVER_MINUTES = 360;

    private final FlightRepository flightRepository;

    public ConnectionValidator(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    public Optional<Long> isValidConnection(Flight inbound, Flight outbound, Airport hub) {
        if (!inbound.getDestination().equals(outbound.getOrigin())) {
            return Optional.empty();
        }

        Instant arrival = TimeZoneUtil.toUtcInstant(inbound.getArrivalTime(), hub.getTimezone());
        Instant departure = TimeZoneUtil.toUtcInstant(outbound.getDepartureTime(), hub.getTimezone());
        long layover = TimeZoneUtil.minutesBetween(arrival, departure);

        if (layover < 0 || layover > MAX_LAYOVER_MINUTES) {
            return Optional.empty();
        }

        long minLayover = isDomestic(inbound, hub, outbound)
                ? MIN_DOMESTIC_MINUTES
                : MIN_INTERNATIONAL_MINUTES;

        if (layover < minLayover) {
            return Optional.empty();
        }

        return Optional.of(layover);
    }

    // domestic only when inbound origin, hub, and outbound destination are all in the same country
    private boolean isDomestic(Flight inbound, Airport hub, Flight outbound) {
        Airport inboundOrigin = flightRepository.getAirport(inbound.getOrigin());
        Airport outboundDest = flightRepository.getAirport(outbound.getDestination());
        if (inboundOrigin == null || outboundDest == null) return false;
        String hubCountry = hub.getCountry();
        return hubCountry.equals(inboundOrigin.getCountry())
                && hubCountry.equals(outboundDest.getCountry());
    }
}
