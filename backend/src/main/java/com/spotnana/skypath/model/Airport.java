package com.spotnana.skypath.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Airport {
    private String code;
    private String name;
    private String city;
    private String country;
    private String timezone;
}
