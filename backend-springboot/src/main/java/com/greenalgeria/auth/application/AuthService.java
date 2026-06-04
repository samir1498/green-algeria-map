package com.greenalgeria.auth.application;

import com.greenalgeria.auth.domain.Account;
import com.greenalgeria.auth.domain.AccountRepository;
import com.greenalgeria.auth.domain.User;
import com.greenalgeria.auth.domain.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository, AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse signUp(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String userId = UUID.randomUUID().toString();
        User user = new User(userId, name, email);
        user = userRepository.save(user);

        Account account = new Account(UUID.randomUUID().toString(), userId, email, passwordEncoder.encode(password));
        accountRepository.save(account);

        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                user.getId(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase())));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return UserResponse.from(user);
    }

    public UserResponse getSession(String userId) {
        return userRepository.findById(userId).map(UserResponse::from).orElse(null);
    }
}
