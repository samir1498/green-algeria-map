package com.greenalgeria.shared.cqrs;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SimpleQueryBus implements QueryBus {

    private final Map<Class<?>, QueryHandler<?, ?>> registry = new ConcurrentHashMap<>();

    public SimpleQueryBus(java.util.List<QueryHandler<?, ?>> handlers) {
        for (var handler : handlers) {
            registry.put(handler.supportedQuery(), handler);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    @Transactional(readOnly = true)
    public <R> R execute(Query<R> query) {
        var handler = (QueryHandler<Query<R>, R>) registry.get(query.getClass());
        if (handler == null) {
            throw new IllegalArgumentException(
                    "No handler registered for " + query.getClass().getSimpleName());
        }
        return handler.handle(query);
    }
}
