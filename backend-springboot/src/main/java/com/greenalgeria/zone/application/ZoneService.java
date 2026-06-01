package com.greenalgeria.zone.application;

import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ZoneService {

    private final ZoneRepository zoneRepository;

    public ZoneService(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public List<ZoneResponse> getAll() {
        return zoneRepository.findAllByOrderByNameAsc().stream()
                .map(ZoneResponse::from)
                .toList();
    }

    public Optional<ZoneResponse> getById(UUID id) {
        return zoneRepository.findById(id).map(ZoneResponse::from);
    }

    @Transactional
    public ZoneResponse create(CreateZoneRequest request) {
        var zone = new Zone(request.name(), request.type(), request.lat(), request.lng());
        if (request.status() != null) zone.setStatus(request.status());
        if (request.targetCount() != null) zone.setTargetCount(request.targetCount());
        if (request.currentCount() != null) zone.setCurrentCount(request.currentCount());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.organizerContact() != null) zone.setOrganizerContact(request.organizerContact());
        if (request.treeSpecies() != null) zone.setTreeSpecies(request.treeSpecies());
        return ZoneResponse.from(zoneRepository.save(zone));
    }

    @Transactional
    public ZoneResponse update(UUID id, UpdateZoneRequest request) {
        var zone = zoneRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));
        if (request.name() != null) zone.setName(request.name());
        if (request.type() != null) zone.setType(request.type());
        if (request.status() != null) zone.setStatus(request.status());
        if (request.lat() != null) zone.setLat(request.lat());
        if (request.lng() != null) zone.setLng(request.lng());
        if (request.targetCount() != null) zone.setTargetCount(request.targetCount());
        if (request.currentCount() != null) zone.setCurrentCount(request.currentCount());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.organizerContact() != null) zone.setOrganizerContact(request.organizerContact());
        if (request.treeSpecies() != null) zone.setTreeSpecies(request.treeSpecies());
        return ZoneResponse.from(zoneRepository.save(zone));
    }

    @Transactional
    public void delete(UUID id) {
        if (!zoneRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found");
        }
        zoneRepository.deleteById(id);
    }

    @Transactional
    public void addPhoto(UUID id, String photoUrl) {
        var zone = zoneRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));
        zone.addPhoto(photoUrl);
        zoneRepository.save(zone);
    }

    @Transactional
    public void registerVolunteer(UUID id) {
        var zone = zoneRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));
        zone.incrementVolunteers();
        zoneRepository.save(zone);
    }
}
