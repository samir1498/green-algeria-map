package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.domain.AuthToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataAuthTokenRepository extends JpaRepository<AuthToken, String> {
    Optional<AuthToken> findByTokenAndType(String token, AuthToken.Type type);
}
