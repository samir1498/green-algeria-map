package com.greenalgeria.shared.cqrs;

public interface CommandBus {

    <R> R execute(Command<R> command);
}
