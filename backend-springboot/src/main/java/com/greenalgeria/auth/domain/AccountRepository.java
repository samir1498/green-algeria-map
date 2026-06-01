package com.greenalgeria.auth.domain;

import java.util.Optional;

public interface AccountRepository {
    Optional<Account> findByAccountIdAndProviderId(String accountId, String providerId);

    Optional<Account> findByUserIdAndProviderId(String userId, String providerId);

    Account save(Account account);
}
