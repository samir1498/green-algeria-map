package com.greenalgeria.auth.domain;

import java.util.Optional;

public interface UserRepository {
    Optional<User> findById(String id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    User save(User user);
}
