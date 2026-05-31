package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.domain.Account;
import com.greenalgeria.auth.domain.AccountRepository;
import com.greenalgeria.auth.domain.User;
import com.greenalgeria.auth.domain.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public CustomUserDetailsService(UserRepository userRepository, AccountRepository accountRepository) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        Account account = accountRepository.findByAccountIdAndProviderId(email, "email")
            .orElseThrow(() -> new UsernameNotFoundException("Account not found for: " + email));

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getId())
            .password(account.getPassword())
            .roles(user.getRole().toUpperCase())
            .build();
    }
}
