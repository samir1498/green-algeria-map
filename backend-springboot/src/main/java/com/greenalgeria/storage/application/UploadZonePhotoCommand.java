package com.greenalgeria.storage.application;

import java.util.UUID;

public record UploadZonePhotoCommand(UUID zoneId, byte[] file, String filename, String mimetype) {}
