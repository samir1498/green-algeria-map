package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.shared.cqrs.Command;
import java.util.UUID;

public record DeleteDamageReportCommand(UUID id) implements Command<Void> {}
