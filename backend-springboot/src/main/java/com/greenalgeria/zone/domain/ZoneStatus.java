package com.greenalgeria.zone.domain;

public enum ZoneStatus {
    planned,
    in_progress,
    completed;

    public ZoneStatus next() {
        return switch (this) {
            case planned -> in_progress;
            case in_progress -> completed;
            case completed -> throw new IllegalStateException("Zone is already completed");
        };
    }
}
