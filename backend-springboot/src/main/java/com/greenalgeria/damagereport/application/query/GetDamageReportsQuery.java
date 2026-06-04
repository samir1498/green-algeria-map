package com.greenalgeria.damagereport.application.query;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.shared.cqrs.Query;
import java.util.List;
import java.util.UUID;

public record GetDamageReportsQuery(UUID zoneId) implements Query<List<DamageReportResponse>> {}
