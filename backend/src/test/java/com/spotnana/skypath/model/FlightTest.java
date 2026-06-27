package com.spotnana.skypath.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FlightTest {

    @Test
    void setPrice_withNumericDouble_storesValue() {
        Flight f = new Flight();
        f.setPrice(299.00);
        assertThat(f.getPrice()).isEqualTo(299.00);
    }

    @Test
    void setPrice_withNumericInteger_storesValue() {
        Flight f = new Flight();
        f.setPrice(199);
        assertThat(f.getPrice()).isEqualTo(199.0);
    }

    @Test
    void setPrice_withValidNumericString_parsesAndStoresValue() {
        Flight f = new Flight();
        f.setPrice("289.00");
        assertThat(f.getPrice()).isEqualTo(289.0);
    }

    @Test
    void setPrice_withStringWithWhitespace_parsesCorrectly() {
        Flight f = new Flight();
        f.setPrice("  99.50  ");
        assertThat(f.getPrice()).isEqualTo(99.50);
    }

    @Test
    void setPrice_withNull_doesNotThrow_andPriceRemainsZero() {
        Flight f = new Flight();
        assertThatCode(() -> f.setPrice(null)).doesNotThrowAnyException();
        assertThat(f.getPrice()).isEqualTo(0.0);
    }

    @Test
    void setPrice_withNonNumericString_throwsNumberFormatException() {
        Flight f = new Flight();
        assertThatThrownBy(() -> f.setPrice("$299"))
                .isInstanceOf(NumberFormatException.class);
    }

    @Test
    void setPrice_withEmptyString_throwsNumberFormatException() {
        Flight f = new Flight();
        assertThatThrownBy(() -> f.setPrice(""))
                .isInstanceOf(NumberFormatException.class);
    }
}
