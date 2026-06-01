package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.shared.cqrs.Command;

public record CreateDamageReportCommand(CreateDamageReportRequest request) implements Command<DamageReportResponse> {}
