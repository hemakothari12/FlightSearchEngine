package com.spotnana.skypath.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class ItineraryResponse {
    private List<FlightResponse> legs;
    private List<Long> layoverMinutes;
    private long totalDuration;
    private double totalPrice;
    private int stops;
    private long totalLayover;
}
