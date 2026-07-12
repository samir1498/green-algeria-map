package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.domain.AuthToken;
import com.greenalgeria.auth.domain.AuthTokenRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class JpaAuthTokenRepository implements AuthTokenRepository {

    private final SpringDataAuthTokenRepository springData;

    public JpaAuthTokenRepository(SpringDataAuthTokenRepository springData) {
        this.springData = springData;
    }

    @Override
    public AuthToken save(AuthToken token) {
        return springData.save(token);
    }

    @Override
    public Optional<AuthToken> findByTokenAndType(String token, AuthToken.Type type) {
        return springData.findByTokenAndType(token, type);
    }

    @Override
    public void delete(AuthToken token) {
        springData.delete(token);
    }
}
