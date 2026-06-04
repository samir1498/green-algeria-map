package com.greenalgeria.shared.cqrs;

public interface QueryHandler<Q extends Query<R>, R> {

    R handle(Q query);

    Class<Q> supportedQuery();
}
