package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportStatus;
import java.util.UUID;

public record UpdateDamageReportStatusCommand(UUID id, DamageReportStatus status) {}
