package com.greenalgeria.shared.cqrs;

public interface QueryBus {

    <R> R execute(Query<R> query);
}
