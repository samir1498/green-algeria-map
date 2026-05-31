package com.greenalgeria.zone.application;

import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
import jakarta.validation.constraints.Min;

public record UpdateZoneRequest(
        String name,
        ZoneType type,
        ZoneStatus status,
        Double lat,
        Double lng,
        @Min(0) Integer targetCount,
        @Min(0) Integer currentCount,
        String description,
        String organizerContact,
        String treeSpecies) {}
