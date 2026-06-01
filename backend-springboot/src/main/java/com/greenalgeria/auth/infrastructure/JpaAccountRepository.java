package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.domain.Account;
import com.greenalgeria.auth.domain.AccountRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class JpaAccountRepository implements AccountRepository {

    private final SpringDataAccountRepository springData;

    public JpaAccountRepository(SpringDataAccountRepository springData) {
        this.springData = springData;
    }

    @Override
    public Optional<Account> findByAccountIdAndProviderId(String accountId, String providerId) {
        return springData.findByAccountIdAndProviderId(accountId, providerId);
    }

    @Override
    public Optional<Account> findByUserIdAndProviderId(String userId, String providerId) {
        return springData.findByUserIdAndProviderId(userId, providerId);
    }

    @Override
    public Account save(Account account) {
        return springData.save(account);
    }
}
