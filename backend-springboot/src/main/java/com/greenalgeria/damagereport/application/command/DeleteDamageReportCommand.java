package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import java.util.UUID;

public record DeleteDamageReportCommand(UUID id) {}
