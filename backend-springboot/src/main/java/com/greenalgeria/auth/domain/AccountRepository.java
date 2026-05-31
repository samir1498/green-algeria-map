package com.greenalgeria.auth.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, String> {
    Optional<Account> findByAccountIdAndProviderId(String accountId, String providerId);

    Optional<Account> findByUserIdAndProviderId(String userId, String providerId);
}
