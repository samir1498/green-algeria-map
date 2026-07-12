package com.greenalgeria.auth.domain;

import java.util.Optional;

public interface AuthTokenRepository {
    AuthToken save(AuthToken token);

    Optional<AuthToken> findByTokenAndType(String token, AuthToken.Type type);

    void delete(AuthToken token);
}
