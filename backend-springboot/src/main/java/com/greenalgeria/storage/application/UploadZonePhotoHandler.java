package com.greenalgeria.storage.application;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.storage.domain.StorageService;
import com.greenalgeria.zone.application.command.AddPhotoToZoneCommand;
import com.greenalgeria.zone.application.command.AddPhotoToZoneHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class UploadZonePhotoHandler implements CommandHandler<UploadZonePhotoCommand, String> {

    private final StorageService storageService;
    private final AddPhotoToZoneHandler addPhotoToZoneHandler;

    public UploadZonePhotoHandler(StorageService storageService, AddPhotoToZoneHandler addPhotoToZoneHandler) {
        this.storageService = storageService;
        this.addPhotoToZoneHandler = addPhotoToZoneHandler;
    }

    public String handle(UploadZonePhotoCommand command) {
        var result = storageService.uploadFile(command.file(), command.filename(), command.mimetype());
        addPhotoToZoneHandler.handle(new AddPhotoToZoneCommand(command.zoneId(), result.url()));
        return result.url();
    }

    @Override
    public Class<UploadZonePhotoCommand> supportedCommand() {
        return UploadZonePhotoCommand.class;
    }
}
