package com.greenalgeria.zone.domain.event;

import com.greenalgeria.shared.cqrs.DomainEvent;
import java.util.UUID;

public record ZoneCreatedEvent(UUID zoneId) implements DomainEvent {}
