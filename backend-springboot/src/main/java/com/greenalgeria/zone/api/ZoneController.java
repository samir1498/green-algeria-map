package com.greenalgeria.zone.api;

import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.application.command.*;
import com.greenalgeria.zone.application.query.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/zones")
@Tag(name = "Zones")
public class ZoneController {

    private final GetAllZonesHandler getAllZonesHandler;
    private final GetZoneByIdHandler getZoneByIdHandler;
    private final CreateZoneHandler createZoneHandler;
    private final UpdateZoneHandler updateZoneHandler;
    private final DeleteZoneHandler deleteZoneHandler;
    private final RegisterVolunteerHandler registerVolunteerHandler;

    public ZoneController(
            GetAllZonesHandler getAllZonesHandler,
            GetZoneByIdHandler getZoneByIdHandler,
            CreateZoneHandler createZoneHandler,
            UpdateZoneHandler updateZoneHandler,
            DeleteZoneHandler deleteZoneHandler,
            RegisterVolunteerHandler registerVolunteerHandler) {
        this.getAllZonesHandler = getAllZonesHandler;
        this.getZoneByIdHandler = getZoneByIdHandler;
        this.createZoneHandler = createZoneHandler;
        this.updateZoneHandler = updateZoneHandler;
        this.deleteZoneHandler = deleteZoneHandler;
        this.registerVolunteerHandler = registerVolunteerHandler;
    }

    @GetMapping
    public ResponseEntity<List<ZoneResponse>> getAll() {
        return ResponseEntity.ok(getAllZonesHandler.handle(new GetAllZonesQuery()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ZoneResponse> getById(@PathVariable UUID id) {
        return getZoneByIdHandler
                .handle(new GetZoneByIdQuery(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ZoneResponse> create(@Valid @RequestBody CreateZoneRequest request) {
        var created = createZoneHandler.handle(new CreateZoneCommand(request));
        return ResponseEntity.created(URI.create("/api/zones/" + created.id())).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ZoneResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(updateZoneHandler.handle(new UpdateZoneCommand(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        deleteZoneHandler.handle(new DeleteZoneCommand(id));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/volunteer")
    public ResponseEntity<Void> registerVolunteer(@PathVariable UUID id) {
        registerVolunteerHandler.handle(new RegisterVolunteerCommand(id));
        return ResponseEntity.noContent().build();
    }
}
