package com.greenalgeria.zone.api;

import com.greenalgeria.zone.application.CreateZoneRequest;
import com.greenalgeria.zone.application.UpdateZoneRequest;
import com.greenalgeria.zone.application.ZoneResponse;
import com.greenalgeria.zone.application.ZoneService;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final ZoneService zoneService;

    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @GetMapping
    public ResponseEntity<List<ZoneResponse>> getAll() {
        return ResponseEntity.ok(zoneService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ZoneResponse> getById(@PathVariable UUID id) {
        return zoneService
                .getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ZoneResponse> create(@RequestBody CreateZoneRequest request) {
        var created = zoneService.create(request);
        return ResponseEntity.created(URI.create("/api/zones/" + created.id())).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ZoneResponse> update(@PathVariable UUID id, @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(zoneService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        zoneService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/volunteer")
    public ResponseEntity<Void> registerVolunteer(@PathVariable UUID id) {
        zoneService.registerVolunteer(id);
        return ResponseEntity.noContent().build();
    }
}
