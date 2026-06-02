package com.greenalgeria.storage.application;

import com.greenalgeria.shared.cqrs.CommandBus;
import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.storage.domain.StorageService;
import com.greenalgeria.zone.application.command.AddPhotoToZoneCommand;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class UploadZonePhotoHandler implements CommandHandler<UploadZonePhotoCommand, String> {

    private final StorageService storageService;
    private final CommandBus commandBus;

    public UploadZonePhotoHandler(StorageService storageService, @Lazy CommandBus commandBus) {
        this.storageService = storageService;
        this.commandBus = commandBus;
    }

    @Override
    public String handle(UploadZonePhotoCommand command) {
        var result = storageService.uploadFile(command.file(), command.filename(), command.mimetype());
        commandBus.execute(new AddPhotoToZoneCommand(command.zoneId(), result.url()));
        return result.url();
    }

    @Override
    public Class<UploadZonePhotoCommand> supportedCommand() {
        return UploadZonePhotoCommand.class;
    }
}
