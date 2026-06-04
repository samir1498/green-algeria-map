package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.Command;
import com.greenalgeria.zone.application.*;

public record CreateZoneCommand(CreateZoneRequest request) implements Command<ZoneResponse> {}
