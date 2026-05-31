package com.greenalgeria.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenalgeria.auth.application.UserResponse;
import com.greenalgeria.auth.domain.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.LinkedHashMap;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public SecurityConfig(ObjectMapper objectMapper, UserRepository userRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/sign-in/email").permitAll()
                .requestMatchers("/api/auth/sign-up/email").permitAll()
                .requestMatchers("/api/auth/sign-out").permitAll()
                .requestMatchers("/api/auth/get-session").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/zones/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/damage-reports/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/healthz", "/readyz").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginProcessingUrl("/api/auth/sign-in/email")
                .usernameParameter("email")
                .passwordParameter("password")
                .successHandler((request, response, authentication) -> {
                    var principal = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
                    var user = userRepository.findById(principal.getUsername()).orElse(null);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    var body = new LinkedHashMap<String, Object>();
                    body.put("user", user != null ? UserResponse.from(user) : null);
                    objectMapper.writeValue(response.getOutputStream(), body);
                })
                .failureHandler((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    var body = new LinkedHashMap<String, String>();
                    body.put("error", "Invalid email or password");
                    objectMapper.writeValue(response.getOutputStream(), body);
                })
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/sign-out")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    var body = new LinkedHashMap<String, Object>();
                    body.put("success", true);
                    objectMapper.writeValue(response.getOutputStream(), body);
                })
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    var body = new LinkedHashMap<String, String>();
                    body.put("error", "Unauthorized");
                    objectMapper.writeValue(response.getOutputStream(), body);
                })
            )
            .securityContext(security -> security
                .securityContextRepository(new HttpSessionSecurityContextRepository())
            )
            .httpBasic(httpBasic -> httpBasic.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
