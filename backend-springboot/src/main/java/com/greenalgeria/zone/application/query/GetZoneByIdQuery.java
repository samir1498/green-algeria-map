package com.greenalgeria.zone.application.query;

import com.greenalgeria.shared.cqrs.Query;
import com.greenalgeria.zone.application.*;
import java.util.Optional;
import java.util.UUID;

public record GetZoneByIdQuery(UUID id) implements Query<Optional<ZoneResponse>> {}
