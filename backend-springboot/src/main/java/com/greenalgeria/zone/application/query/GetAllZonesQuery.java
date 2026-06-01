package com.greenalgeria.zone.application.query;

import com.greenalgeria.shared.cqrs.Query;
import com.greenalgeria.zone.application.*;
import java.util.List;

public record GetAllZonesQuery() implements Query<List<ZoneResponse>> {}
