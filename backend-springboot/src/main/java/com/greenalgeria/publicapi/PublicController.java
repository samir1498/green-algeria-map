package com.greenalgeria.publicapi;

import com.greenalgeria.damagereport.application.DamageReportResponse;
import com.greenalgeria.damagereport.application.DamageReportService;
import com.greenalgeria.zone.application.ZoneResponse;
import com.greenalgeria.zone.application.ZoneService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public")
public class PublicController {

    private final ZoneService zoneService;
    private final DamageReportService damageReportService;

    public PublicController(ZoneService zoneService, DamageReportService damageReportService) {
        this.zoneService = zoneService;
        this.damageReportService = damageReportService;
    }

    @GetMapping("/map")
    public ResponseEntity<MapDataResponse> getMapData() {
        var zones = zoneService.getAll();
        var damageReports = damageReportService.getAll(null);
        return ResponseEntity.ok(new MapDataResponse(zones, damageReports));
    }

    private record MapDataResponse(
            java.util.List<ZoneResponse> zones, java.util.List<DamageReportResponse> damageReports) {}
}
