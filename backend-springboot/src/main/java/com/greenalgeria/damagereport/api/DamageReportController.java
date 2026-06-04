package com.greenalgeria.damagereport.api;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.application.command.*;
import com.greenalgeria.damagereport.application.query.*;
import com.greenalgeria.shared.cqrs.CommandBus;
import com.greenalgeria.shared.cqrs.QueryBus;
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

    private final CommandBus commandBus;
    private final QueryBus queryBus;

    public DamageReportController(CommandBus commandBus, QueryBus queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping("/damage-reports")
    public ResponseEntity<List<DamageReportResponse>> getAll(@RequestParam(required = false) UUID zoneId) {
        return ResponseEntity.ok(queryBus.execute(new GetDamageReportsQuery(zoneId)));
    }

    @GetMapping("/damage-reports/{id}")
    public ResponseEntity<DamageReportResponse> getById(@PathVariable UUID id) {
        return queryBus.execute(new GetDamageReportByIdQuery(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/zones/{zoneId}/damage-reports")
    public ResponseEntity<List<DamageReportResponse>> getByZoneId(@PathVariable UUID zoneId) {
        return ResponseEntity.ok(queryBus.execute(new GetDamageReportsQuery(zoneId)));
    }

    @PostMapping("/damage-reports")
    public ResponseEntity<DamageReportResponse> create(@Valid @RequestBody CreateDamageReportRequest request) {
        var response = commandBus.execute(new CreateDamageReportCommand(request));
        return ResponseEntity.created(URI.create("/api/damage-reports/" + response.id()))
                .body(response);
    }

    @PatchMapping("/damage-reports/{id}/status")
    public ResponseEntity<DamageReportResponse> updateStatus(
            @PathVariable UUID id, @Valid @RequestBody UpdateDamageReportStatusRequest request) {
        var response = commandBus.execute(new UpdateDamageReportStatusCommand(id, request.status()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/damage-reports/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        commandBus.execute(new DeleteDamageReportCommand(id));
        return ResponseEntity.noContent().build();
    }
}
