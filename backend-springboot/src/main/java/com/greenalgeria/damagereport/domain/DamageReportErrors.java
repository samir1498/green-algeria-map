package com.greenalgeria.damagereport.domain;

import com.greenalgeria.shared.exception.DomainError;

public final class DamageReportErrors {

    private DamageReportErrors() {}

    public static class InvalidDamageReportTypeError extends DomainError {
        public InvalidDamageReportTypeError(String type) {
            super("Invalid damage report type: " + type, "validation");
        }
    }

    public static class InvalidDamageReportSeverityError extends DomainError {
        public InvalidDamageReportSeverityError(String severity) {
            super("Invalid damage report severity: " + severity, "validation");
        }
    }

    public static class InvalidDamageReportStatusError extends DomainError {
        public InvalidDamageReportStatusError(String status) {
            super("Invalid damage report status: " + status, "validation");
        }
    }

    public static class InvalidStatusTransitionError extends DomainError {
        public InvalidStatusTransitionError(String from, String to) {
            super("Invalid status transition: " + from + " -> " + to, "validation");
        }
    }
}
