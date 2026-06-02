package com.greenalgeria.publicapi;

import com.greenalgeria.damagereport.application.DamageReportResponse;
import com.greenalgeria.damagereport.application.query.GetAllDamageReportsHandler;
import com.greenalgeria.damagereport.application.query.GetAllDamageReportsQuery;
import com.greenalgeria.zone.application.ZoneResponse;
import com.greenalgeria.zone.application.query.GetAllZonesHandler;
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

    private final GetAllZonesHandler getAllZonesHandler;
    private final GetAllDamageReportsHandler getAllDamageReportsHandler;

    public PublicController(
            GetAllZonesHandler getAllZonesHandler, GetAllDamageReportsHandler getAllDamageReportsHandler) {
        this.getAllZonesHandler = getAllZonesHandler;
        this.getAllDamageReportsHandler = getAllDamageReportsHandler;
    }

    @GetMapping("/map")
    public ResponseEntity<MapDataResponse> getMapData() {
        var zones = getAllZonesHandler.handle(new GetAllZonesQuery());
        var damageReports = getAllDamageReportsHandler.handle(new GetAllDamageReportsQuery(null));
        return ResponseEntity.ok(new MapDataResponse(zones, damageReports));
    }

    private record MapDataResponse(
            java.util.List<ZoneResponse> zones, java.util.List<DamageReportResponse> damageReports) {}
}
