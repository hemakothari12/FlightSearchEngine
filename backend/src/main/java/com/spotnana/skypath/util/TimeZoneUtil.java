package com.spotnana.skypath.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

public class TimeZoneUtil {

    private TimeZoneUtil() {}

    public static Instant toUtcInstant(LocalDateTime localTime, String ianaTimezone) {
        return localTime.atZone(ZoneId.of(ianaTimezone)).toInstant();
    }

    public static long minutesBetween(Instant a, Instant b) {
        return (b.toEpochMilli() - a.toEpochMilli()) / 60_000;
    }
}
