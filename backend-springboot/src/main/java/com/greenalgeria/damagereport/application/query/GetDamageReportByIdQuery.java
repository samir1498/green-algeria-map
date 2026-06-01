package com.greenalgeria.damagereport.application.query;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.shared.cqrs.Query;
import java.util.Optional;
import java.util.UUID;

public record GetDamageReportByIdQuery(UUID id) implements Query<Optional<DamageReportResponse>> {}
