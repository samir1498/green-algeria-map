package com.greenalgeria.config;

import com.greenalgeria.auth.infrastructure.CurrentUserArgumentResolver;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfigurer implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUserArgumentResolver;
    private final RateLimitInterceptor rateLimitInterceptor;

    public WebConfigurer(
            CurrentUserArgumentResolver currentUserArgumentResolver,
            @Autowired(required = false) RateLimitInterceptor rateLimitInterceptor) {
        this.currentUserArgumentResolver = currentUserArgumentResolver;
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserArgumentResolver);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (rateLimitInterceptor != null) {
            registry.addInterceptor(rateLimitInterceptor).addPathPatterns("/api/**");
        }
    }
}
