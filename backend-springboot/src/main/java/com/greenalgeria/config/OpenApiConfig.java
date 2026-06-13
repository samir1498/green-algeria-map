package com.greenalgeria.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "app.swagger.enabled", havingValue = "true", matchIfMissing = true)
@OpenAPIDefinition(
        info =
                @Info(
                        title = "Green Algeria Map API",
                        version = "0.1.0",
                        description = "REST API for the Green Algeria reforestation platform"),
        servers = @Server(url = "http://localhost:8081"))
@SecurityScheme(
        name = "session",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.COOKIE,
        description = "Session-based auth via session_token cookie (set by form login at /api/auth/sign-in/email)")
public class OpenApiConfig {}
