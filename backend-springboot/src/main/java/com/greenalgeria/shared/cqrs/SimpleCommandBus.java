package com.greenalgeria.shared.cqrs;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class SimpleCommandBus implements CommandBus {

    private final Map<Class<?>, CommandHandler<?, ?>> registry = new ConcurrentHashMap<>();

    public SimpleCommandBus(java.util.List<CommandHandler<?, ?>> handlers) {
        for (var handler : handlers) {
            registry.put(handler.supportedCommand(), handler);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <R> R execute(Command<R> command) {
        var handler = (CommandHandler<Command<R>, R>) registry.get(command.getClass());
        if (handler == null) {
            throw new IllegalArgumentException(
                    "No handler registered for " + command.getClass().getSimpleName());
        }
        return handler.handle(command);
    }
}
