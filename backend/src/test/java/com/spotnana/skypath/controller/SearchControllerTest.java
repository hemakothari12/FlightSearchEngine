package com.spotnana.skypath.controller;

import com.spotnana.skypath.exception.AirportNotFoundException;
import com.spotnana.skypath.model.Itinerary;
import com.spotnana.skypath.service.SearchService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SearchController.class)
class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SearchService searchService;

    @Test
    void validSearch_returns200WithArray() throws Exception {
        Itinerary itinerary = new Itinerary(List.of(), List.of(), 300L, 299.0);
        when(searchService.search("JFK", "LAX", LocalDate.of(2024, 3, 15)))
                .thenReturn(List.of(itinerary));

        mockMvc.perform(get("/api/search")
                        .param("origin", "JFK")
                        .param("destination", "LAX")
                        .param("date", "2024-03-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void emptyResults_returns200WithEmptyArray() throws Exception {
        when(searchService.search("BOS", "SEA", LocalDate.of(2024, 3, 15)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/search")
                        .param("origin", "BOS")
                        .param("destination", "SEA")
                        .param("date", "2024-03-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void lowercaseIata_returns400() throws Exception {
        mockMvc.perform(get("/api/search")
                        .param("origin", "jfk")
                        .param("destination", "LAX")
                        .param("date", "2024-03-15"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void twoCharIata_returns400() throws Exception {
        mockMvc.perform(get("/api/search")
                        .param("origin", "JF")
                        .param("destination", "LAX")
                        .param("date", "2024-03-15"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sameOriginAndDestination_returns400() throws Exception {
        mockMvc.perform(get("/api/search")
                        .param("origin", "JFK")
                        .param("destination", "JFK")
                        .param("date", "2024-03-15"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void invalidDate_returns400() throws Exception {
        mockMvc.perform(get("/api/search")
                        .param("origin", "JFK")
                        .param("destination", "LAX")
                        .param("date", "not-a-date"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownAirport_returns404WithErrorBody() throws Exception {
        when(searchService.search("XXX", "LAX", LocalDate.of(2024, 3, 15)))
                .thenThrow(new AirportNotFoundException("XXX"));

        mockMvc.perform(get("/api/search")
                        .param("origin", "XXX")
                        .param("destination", "LAX")
                        .param("date", "2024-03-15"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Unknown airport code: XXX"));
    }
}
