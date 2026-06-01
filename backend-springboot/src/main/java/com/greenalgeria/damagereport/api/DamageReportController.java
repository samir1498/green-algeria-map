package com.greenalgeria.damagereport.api;

import com.greenalgeria.damagereport.application.CreateDamageReportRequest;
import com.greenalgeria.damagereport.application.DamageReportResponse;
import com.greenalgeria.damagereport.application.DamageReportService;
import com.greenalgeria.damagereport.application.UpdateDamageReportStatusRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@Tag(name = "Damage Reports")
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

    @PostMapping("/damage-reports")
    public ResponseEntity<DamageReportResponse> create(@Valid @RequestBody CreateDamageReportRequest request) {
        var response = damageReportService.create(request);
        return ResponseEntity.created(URI.create("/api/damage-reports/" + response.id()))
                .body(response);
    }

    @PatchMapping("/damage-reports/{id}/status")
    public ResponseEntity<DamageReportResponse> updateStatus(
            @PathVariable UUID id, @Valid @RequestBody UpdateDamageReportStatusRequest request) {
        var response = damageReportService.updateStatus(id, request.status());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/damage-reports/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        damageReportService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
