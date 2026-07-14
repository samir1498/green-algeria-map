package com.greenalgeria.auth.application;

import com.greenalgeria.auth.domain.Account;
import com.greenalgeria.auth.domain.AccountRepository;
import com.greenalgeria.auth.domain.User;
import com.greenalgeria.auth.domain.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
@Transactional
public class SocialAuthService {

    private static final Logger log = LoggerFactory.getLogger(SocialAuthService.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private final String googleClientId;
    private final String googleClientSecret;
    private final String githubClientId;
    private final String githubClientSecret;
    private final String baseUrl;
    private final String clientUrl;

    public SocialAuthService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            @Value("${oauth.google.client-id:}") String googleClientId,
            @Value("${oauth.google.client-secret:}") String googleClientSecret,
            @Value("${oauth.github.client-id:}") String githubClientId,
            @Value("${oauth.github.client-secret:}") String githubClientSecret,
            @Value("${server.base-url:http://localhost:8081}") String baseUrl,
            @Value("${app.client-url:http://localhost:3000}") String clientUrl) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
        this.githubClientId = githubClientId;
        this.githubClientSecret = githubClientSecret;
        this.baseUrl = baseUrl;
        this.clientUrl = clientUrl;
    }

    public String getAuthorizeUrl(String provider) {
        String redirectUri = baseUrl + "/api/auth/oauth2/callback/" + provider;
        String state = generateState();

        return switch (provider) {
            case "google" ->
                "https://accounts.google.com/o/oauth2/v2/auth?client_id="
                        + urlEncode(googleClientId)
                        + "&redirect_uri=" + urlEncode(redirectUri)
                        + "&response_type=code"
                        + "&scope=" + urlEncode("openid email profile")
                        + "&state=" + urlEncode(state)
                        + "&access_type=offline"
                        + "&prompt=consent";
            case "github" ->
                "https://github.com/login/oauth/authorize?client_id="
                        + urlEncode(githubClientId)
                        + "&redirect_uri=" + urlEncode(redirectUri)
                        + "&scope=" + urlEncode("user:email")
                        + "&state=" + urlEncode(state);
            default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
        };
    }

    public String handleCallback(String provider, String code) {
        String redirectUri = baseUrl + "/api/auth/oauth2/callback/" + provider;

        Map<String, Object> userInfo =
                switch (provider) {
                    case "google" -> handleGoogleCallback(code, redirectUri);
                    case "github" -> handleGitHubCallback(code, redirectUri);
                    default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
                };

        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String providerAccountId = (String) userInfo.get("id");
        String image = (String) userInfo.get("image");

        Optional<Account> existing = accountRepository.findByAccountIdAndProviderId(providerAccountId, provider);
        User user;
        if (existing.isPresent()) {
            user = userRepository.findById(existing.get().getUserId()).orElseThrow();
        } else {
            Optional<User> byEmail = email != null ? userRepository.findByEmail(email) : Optional.empty();
            if (byEmail.isPresent()) {
                user = byEmail.get();
            } else {
                user = new User(UUID.randomUUID().toString(), name != null ? name : email, email);
                if (image != null) {
                    user.setImage(image);
                }
                user = userRepository.save(user);
            }
            Account account = new Account(UUID.randomUUID().toString(), user.getId(), providerAccountId, null);
            account.setProviderId(provider);
            accountRepository.save(account);
        }

        return clientUrl + "/auth/login?oauth=success";
    }

    private Map<String, Object> handleGoogleCallback(String code, String redirectUri) {
        Map<String, String> tokenRequest = Map.of(
                "client_id", googleClientId,
                "client_secret", googleClientSecret,
                "code", code,
                "redirect_uri", redirectUri,
                "grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");

        HttpEntity<Map<String, String>> request = new HttpEntity<>(tokenRequest, headers);
        ResponseEntity<Map> tokenResponse =
                restTemplate.postForEntity("https://oauth2.googleapis.com/token", request, Map.class);
        String accessToken = (String) tokenResponse.getBody().get("access_token");

        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.set("Authorization", "Bearer " + accessToken);
        HttpEntity<?> userRequest = new HttpEntity<>(userHeaders);
        ResponseEntity<Map> userResponse = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                org.springframework.http.HttpMethod.GET,
                userRequest,
                Map.class);
        Map<String, Object> body = userResponse.getBody();
        return Map.of(
                "id", String.valueOf(body.get("id")),
                "email", body.get("email"),
                "name", body.get("name"),
                "image", body.get("picture"));
    }

    private Map<String, Object> handleGitHubCallback(String code, String redirectUri) {
        Map<String, String> tokenRequest = Map.of(
                "client_id", githubClientId,
                "client_secret", githubClientSecret,
                "code", code,
                "redirect_uri", redirectUri);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");

        HttpEntity<Map<String, String>> request = new HttpEntity<>(tokenRequest, headers);
        ResponseEntity<Map> tokenResponse =
                restTemplate.postForEntity("https://github.com/login/oauth/access_token", request, Map.class);
        String accessToken = (String) tokenResponse.getBody().get("access_token");

        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.set("Authorization", "Bearer " + accessToken);
        userHeaders.set("Accept", "application/vnd.github.v3+json");
        HttpEntity<?> userRequest = new HttpEntity<>(userHeaders);
        ResponseEntity<Map> userResponse = restTemplate.exchange(
                "https://api.github.com/user", org.springframework.http.HttpMethod.GET, userRequest, Map.class);
        Map<String, Object> body = userResponse.getBody();
        String email = (String) body.get("email");
        if (email == null || email.isBlank()) {
            ResponseEntity<Map[]> emailsResponse = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    org.springframework.http.HttpMethod.GET,
                    userRequest,
                    Map[].class);
            for (Map<String, Object> entry : emailsResponse.getBody()) {
                if (Boolean.TRUE.equals(entry.get("primary"))) {
                    email = (String) entry.get("email");
                    break;
                }
            }
        }
        return Map.of(
                "id",
                String.valueOf(body.get("id")),
                "email",
                email != null ? email : "",
                "name",
                body.get("name") != null ? body.get("name") : body.get("login"),
                "image",
                body.get("avatar_url"));
    }

    private static String generateState() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
