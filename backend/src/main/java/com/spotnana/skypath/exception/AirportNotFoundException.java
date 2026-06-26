package com.spotnana.skypath.exception;

public class AirportNotFoundException extends RuntimeException {

    private final String code;

    public AirportNotFoundException(String code) {
        super("Unknown airport code: " + code);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
