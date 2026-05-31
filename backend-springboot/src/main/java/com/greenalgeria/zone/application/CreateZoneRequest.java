package com.greenalgeria.zone.application;

import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateZoneRequest(
        @NotBlank String name,
        @NotNull ZoneType type,
        ZoneStatus status,
        @NotNull Double lat,
        @NotNull Double lng,
        @Min(0) Integer targetCount,
        @Min(0) Integer currentCount,
        @NotBlank String description,
        String organizerContact,
        String treeSpecies) {}
