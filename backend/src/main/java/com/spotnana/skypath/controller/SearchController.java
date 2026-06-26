package com.spotnana.skypath.controller;

import com.spotnana.skypath.exception.InvalidInputException;
import com.spotnana.skypath.model.Itinerary;
import com.spotnana.skypath.service.SearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api")
public class SearchController {

    private static final java.util.regex.Pattern IATA = java.util.regex.Pattern.compile("^[A-Z]{3}$");

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/search")
    public List<Itinerary> search(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam String date) {

        if (!IATA.matcher(origin).matches()) {
            throw new InvalidInputException("Origin must be exactly 3 uppercase letters, got: " + origin);
        }
        if (!IATA.matcher(destination).matches()) {
            throw new InvalidInputException("Destination must be exactly 3 uppercase letters, got: " + destination);
        }
        if (origin.equals(destination)) {
            throw new InvalidInputException("Origin and destination must be different");
        }

        LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);

        return searchService.search(origin, destination, localDate);
    }
}
