package com.greenalgeria.zone.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum ZoneStatus {
    planned,
    @JsonProperty("in-progress")
    in_progress,
    completed;
}
