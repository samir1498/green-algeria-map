package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.domain.User;
import com.greenalgeria.auth.domain.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class JpaUserRepository implements UserRepository {

    private final SpringDataUserRepository springData;

    public JpaUserRepository(SpringDataUserRepository springData) {
        this.springData = springData;
    }

    @Override
    public Optional<User> findById(String id) {
        return springData.findById(id);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return springData.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return springData.existsByEmail(email);
    }

    @Override
    public User save(User user) {
        return springData.save(user);
    }
}
