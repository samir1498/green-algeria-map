package com.greenalgeria.storage.application;

import com.greenalgeria.shared.cqrs.Command;
import java.util.UUID;

public record UploadZonePhotoCommand(UUID zoneId, byte[] file, String filename, String mimetype)
        implements Command<String> {}
