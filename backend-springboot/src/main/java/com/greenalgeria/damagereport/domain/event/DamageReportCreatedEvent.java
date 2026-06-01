package com.greenalgeria.damagereport.domain.event;

import com.greenalgeria.damagereport.domain.DamageReportType;
import java.util.UUID;

public record DamageReportCreatedEvent(UUID reportId, UUID zoneId, DamageReportType type) {}
