package com.greenalgeria.damagereport.application;

import com.greenalgeria.damagereport.domain.DamageReportStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDamageReportStatusRequest(@NotNull DamageReportStatus status) {}
