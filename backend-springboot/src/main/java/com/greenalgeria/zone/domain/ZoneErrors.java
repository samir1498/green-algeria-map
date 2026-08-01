package com.greenalgeria.zone.domain;

import com.greenalgeria.shared.exception.DomainError;

public final class ZoneErrors {

    private ZoneErrors() {}

    public static class CannotStartZoneError extends DomainError {
        public CannotStartZoneError(String status) {
            super("Cannot start zone: current status is \"" + status + "\"", "validation");
        }
    }

    public static class CannotCompleteZoneError extends DomainError {
        public CannotCompleteZoneError(int current, Integer target) {
            super("Cannot complete zone: target not reached (" + current + "/" + (target != null ? target : "N/A") + ")",
                    "validation");
        }
    }

    public static class NegativeCountError extends DomainError {
        public NegativeCountError() {
            super("Count cannot be negative", "validation");
        }
    }

    public static class InvalidZoneTypeError extends DomainError {
        public InvalidZoneTypeError(String type) {
            super("Invalid zone type: " + type, "validation");
        }
    }

    public static class InvalidZoneStatusError extends DomainError {
        public InvalidZoneStatusError(String status) {
            super("Invalid zone status: " + status, "validation");
        }
    }
}
