package com.greenalgeria.config;

import jakarta.servlet.http.HttpServletResponse;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper;
    private final List<String> allowedOrigins;

    public SecurityConfig(ObjectMapper objectMapper, @Value("${app.cors.allowed-origins}") String allowedOrigins) {
        this.objectMapper = objectMapper;
        this.allowedOrigins = List.of(allowedOrigins.split(","));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.requestMatchers("/api/auth/sign-in/email")
                        .permitAll()
                        .requestMatchers("/api/auth/sign-up/email")
                        .permitAll()
                        .requestMatchers("/api/auth/sign-out")
                        .permitAll()
                        .requestMatchers("/api/auth/get-session")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/zones/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/zones/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/damage-reports/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/damage-reports/**")
                        .permitAll()
                        .requestMatchers("/api/public/**")
                        .permitAll()
                        .requestMatchers("/healthz", "/readyz")
                        .permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .logout(logout -> logout.logoutUrl("/api/auth/sign-out")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            var body = new LinkedHashMap<String, Object>();
                            body.put("success", true);
                            objectMapper.writeValue(response.getOutputStream(), body);
                        }))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            var body = new LinkedHashMap<String, String>();
                            body.put("error", "Unauthorized");
                            objectMapper.writeValue(response.getOutputStream(), body);
                        })
                        .accessDeniedHandler(accessDeniedHandler()))
                .securityContext(
                        security -> security.securityContextRepository(new HttpSessionSecurityContextRepository()))
                .httpBasic(httpBasic -> httpBasic.disable());

        return http.build();
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            var body = new LinkedHashMap<String, String>();
            body.put("error", "Forbidden");
            objectMapper.writeValue(response.getOutputStream(), body);
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
