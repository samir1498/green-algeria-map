package com.greenalgeria.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, String> {
    Optional<Account> findByAccountIdAndProviderId(String accountId, String providerId);
    Optional<Account> findByUserIdAndProviderId(String userId, String providerId);
}
