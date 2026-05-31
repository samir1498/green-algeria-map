package com.greenalgeria.zone.application;

import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;

public record CreateZoneRequest(
        String name,
        ZoneType type,
        ZoneStatus status,
        Double lat,
        Double lng,
        Integer targetCount,
        Integer currentCount,
        String description,
        String organizerContact,
        String treeSpecies) {}
