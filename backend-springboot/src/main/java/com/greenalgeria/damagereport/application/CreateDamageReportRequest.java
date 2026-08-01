package com.greenalgeria.damagereport.application;

import com.greenalgeria.damagereport.domain.DamageReportSeverity;
import com.greenalgeria.damagereport.domain.DamageReportType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateDamageReportRequest(
        @NotNull UUID zoneId,
        @NotNull DamageReportType type,
        @NotNull DamageReportSeverity severity,
        @NotNull @Min(-90) @Max(90) Double lat,
        @NotNull @Min(-180) @Max(180) Double lng,
        @NotBlank String description,
        @NotBlank String reportedBy) {}
