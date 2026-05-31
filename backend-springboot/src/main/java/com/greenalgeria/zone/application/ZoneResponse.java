package com.greenalgeria.zone.application;

import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
import java.util.List;
import java.util.UUID;

public record ZoneResponse(
    UUID id,
    String name,
    ZoneType type,
    ZoneStatus status,
    Double lat,
    Double lng,
    Integer targetCount,
    Integer currentCount,
    String description,
    List<String> photos,
    String organizerContact,
    String treeSpecies,
    Integer volunteerCount
) {
    public static ZoneResponse from(Zone zone) {
        List<String> photoList = zone.getPhotos() != null && !zone.getPhotos().isBlank()
            ? List.of(zone.getPhotos().split(","))
            : List.of();
        return new ZoneResponse(
            zone.getId(), zone.getName(), zone.getType(), zone.getStatus(),
            zone.getLat(), zone.getLng(), zone.getTargetCount(), zone.getCurrentCount(),
            zone.getDescription(), photoList, zone.getOrganizerContact(),
            zone.getTreeSpecies(), zone.getVolunteerCount()
        );
    }
}
