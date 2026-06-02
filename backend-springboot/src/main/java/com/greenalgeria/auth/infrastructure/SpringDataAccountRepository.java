package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.domain.Account;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataAccountRepository extends JpaRepository<Account, String> {
    Optional<Account> findByAccountIdAndProviderId(String accountId, String providerId);

    Optional<Account> findByUserIdAndProviderId(String userId, String providerId);
}
