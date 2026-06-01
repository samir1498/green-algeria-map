package com.greenalgeria.zone.domain.event;

import com.greenalgeria.zone.domain.ZoneType;
import java.util.UUID;

public record ZoneCreatedEvent(UUID zoneId, String name, ZoneType type) {}
