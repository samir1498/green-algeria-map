package com.greenalgeria.damagereport.api;

import com.greenalgeria.damagereport.application.DamageReportResponse;
import com.greenalgeria.damagereport.application.DamageReportService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DamageReportController {

    private final DamageReportService damageReportService;

    public DamageReportController(DamageReportService damageReportService) {
        this.damageReportService = damageReportService;
    }

    @GetMapping("/damage-reports")
    public ResponseEntity<List<DamageReportResponse>> getAll(@RequestParam(required = false) UUID zoneId) {
        return ResponseEntity.ok(damageReportService.getAll(zoneId));
    }

    @GetMapping("/damage-reports/{id}")
    public ResponseEntity<DamageReportResponse> getById(@PathVariable UUID id) {
        return damageReportService
                .getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/zones/{zoneId}/damage-reports")
    public ResponseEntity<List<DamageReportResponse>> getByZoneId(@PathVariable UUID zoneId) {
        return ResponseEntity.ok(damageReportService.getAll(zoneId));
    }
}
