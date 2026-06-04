package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.Command;
import com.greenalgeria.zone.application.*;
import java.util.UUID;

public record UpdateZoneCommand(UUID id, UpdateZoneRequest request) implements Command<ZoneResponse> {}
