package com.spotnana.skypath.util;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class TimeZoneUtilTest {

    @Test
    void toUtcInstant_easternDaylightTime() {
        // March 15 2024: US Eastern is EDT (UTC-4), DST started March 10
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 8, 30, 0);
        assertThat(TimeZoneUtil.toUtcInstant(local, "America/New_York"))
                .isEqualTo(Instant.parse("2024-03-15T12:30:00Z"));
    }

    @Test
    void toUtcInstant_pacificDaylightTime() {
        // March 15 2024: LA is PDT (UTC-7)
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 11, 45, 0);
        assertThat(TimeZoneUtil.toUtcInstant(local, "America/Los_Angeles"))
                .isEqualTo(Instant.parse("2024-03-15T18:45:00Z"));
    }

    @Test
    void toUtcInstant_sydneyAEDT_datelineCrossing() {
        // March 15 2024: Sydney is AEDT (UTC+11)
        // 09:00 SYD = 22:00 UTC previous day (March 14)
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 9, 0, 0);
        assertThat(TimeZoneUtil.toUtcInstant(local, "Australia/Sydney"))
                .isEqualTo(Instant.parse("2024-03-14T22:00:00Z"));
    }

    @Test
    void minutesBetween_standardCase() {
        Instant a = Instant.parse("2024-03-15T10:00:00Z");
        Instant b = Instant.parse("2024-03-15T11:30:00Z");
        assertThat(TimeZoneUtil.minutesBetween(a, b)).isEqualTo(90L);
    }

    @Test
    void minutesBetween_acrossMidnight() {
        Instant a = Instant.parse("2024-03-15T23:00:00Z");
        Instant b = Instant.parse("2024-03-16T01:00:00Z");
        assertThat(TimeZoneUtil.minutesBetween(a, b)).isEqualTo(120L);
    }

    @Test
    void toUtcInstant_tokyoJST() {
        // JST is UTC+9 (no DST). 17:00 local → 08:00 UTC.
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 17, 0, 0);
        assertThat(TimeZoneUtil.toUtcInstant(local, "Asia/Tokyo"))
                .isEqualTo(Instant.parse("2024-03-15T08:00:00Z"));
    }

    @Test
    void toUtcInstant_dubaiGST() {
        // Asia/Dubai is UTC+4 (no DST). 14:00 local → 10:00 UTC.
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 14, 0, 0);
        assertThat(TimeZoneUtil.toUtcInstant(local, "Asia/Dubai"))
                .isEqualTo(Instant.parse("2024-03-15T10:00:00Z"));
    }

    @Test
    void toUtcInstant_phoenixMST_noDST() {
        // America/Phoenix is always UTC-7 (no DST). 11:00 local → 18:00 UTC.
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 11, 0, 0);
        assertThat(TimeZoneUtil.toUtcInstant(local, "America/Phoenix"))
                .isEqualTo(Instant.parse("2024-03-15T18:00:00Z"));
    }

    @Test
    void minutesBetween_sydToLaxDateline() {
        // SYD departs 09:00 AEDT = 14 Mar 22:00 UTC, LAX arrives 06:00 PDT = 15 Mar 13:00 UTC → 900 min
        Instant sydDep = Instant.parse("2024-03-14T22:00:00Z");
        Instant laxArr = Instant.parse("2024-03-15T13:00:00Z");
        assertThat(TimeZoneUtil.minutesBetween(sydDep, laxArr)).isEqualTo(900L);
    }
}
