package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.domain.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public LoginSuccessHandler(ObjectMapper objectMapper, UserRepository userRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        var principal = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
        var user = userRepository.findById(principal.getUsername()).orElse(null);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        var body = new LinkedHashMap<String, Object>();
        if (user != null) {
            var userMap = new LinkedHashMap<String, Object>();
            userMap.put("id", user.getId());
            userMap.put("email", user.getEmail());
            userMap.put("name", user.getName());
            userMap.put("role", user.getRole());
            body.put("user", userMap);
        } else {
            body.put("user", null);
        }
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
