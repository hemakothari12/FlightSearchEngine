package com.spotnana.skypath.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
public class Itinerary {
    private List<Flight> legs;
    private List<Long> layoverMinutes;
    private long totalDuration;
    private double totalPrice;
}
