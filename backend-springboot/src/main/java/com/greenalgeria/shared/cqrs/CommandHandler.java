package com.greenalgeria.shared.cqrs;

public interface CommandHandler<C extends Command<R>, R> {

    R handle(C command);

    Class<C> supportedCommand();
}
