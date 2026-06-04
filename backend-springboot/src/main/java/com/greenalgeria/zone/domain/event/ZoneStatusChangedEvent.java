package com.greenalgeria.zone.domain.event;

import com.greenalgeria.shared.cqrs.DomainEvent;
import com.greenalgeria.zone.domain.ZoneStatus;
import java.util.UUID;

public record ZoneStatusChangedEvent(UUID zoneId, ZoneStatus oldStatus, ZoneStatus newStatus) implements DomainEvent {}
