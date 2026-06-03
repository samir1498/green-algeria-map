package com.greenalgeria.auth.infrastructure;

import com.greenalgeria.auth.api.CurrentUser;
import com.greenalgeria.auth.domain.User;
import com.greenalgeria.auth.domain.UserRepository;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final UserRepository userRepository;

    public CurrentUserArgumentResolver(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && parameter.getParameterType().equals(User.class);
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {
        var authentication = (Authentication) webRequest.getUserPrincipal();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userRepository.findById(authentication.getName()).orElse(null);
    }
}
