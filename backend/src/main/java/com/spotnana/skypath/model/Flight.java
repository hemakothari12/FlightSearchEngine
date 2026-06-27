package com.spotnana.skypath.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AccessLevel;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Flight {
    private String flightNumber;
    private String airline;
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private String aircraft;

    @Setter(AccessLevel.NONE)
    private double price;

    // handles numeric (299.00), string ("289.00"), and null price values in the dataset
    @JsonProperty("price")
    public void setPrice(Object price) {
        if (price == null) return;
        if (price instanceof Number) {
            this.price = ((Number) price).doubleValue();
        } else {
            this.price = Double.parseDouble(price.toString().trim());
        }
    }
}
