package com.greenalgeria.publicapi;

import com.greenalgeria.damagereport.application.DamageReportResponse;
import com.greenalgeria.damagereport.application.query.GetDamageReportsQuery;
import com.greenalgeria.shared.cqrs.QueryBus;
import com.greenalgeria.zone.application.ZoneResponse;
import com.greenalgeria.zone.application.query.GetAllZonesQuery;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public")
public class PublicController {

    private final QueryBus queryBus;

    public PublicController(QueryBus queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping("/map")
    public ResponseEntity<MapDataResponse> getMapData() {
        var zones = queryBus.execute(new GetAllZonesQuery());
        var damageReports = queryBus.execute(new GetDamageReportsQuery(null));
        return ResponseEntity.ok(new MapDataResponse(zones, damageReports));
    }

    private record MapDataResponse(
            java.util.List<ZoneResponse> zones, java.util.List<DamageReportResponse> damageReports) {}
}
