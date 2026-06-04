package com.greenalgeria.damagereport.domain.event;

import com.greenalgeria.shared.cqrs.DomainEvent;
import java.util.UUID;

public record DamageReportCreatedEvent(UUID reportId) implements DomainEvent {}
