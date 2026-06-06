package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/green-algeria-map/backend-go/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupAuthHandler(t *testing.T) *AuthHandler {
	t.Helper()
	store := repository.NewInMemoryStore()
	svc := service.NewAuthService(store)
	return NewAuthHandler(svc)
}

func executeRequest(method, path, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	return w
}

func TestPing(t *testing.T) {
	w := executeRequest(http.MethodGet, "/api/ping", "")
	handler := http.HandlerFunc(Ping)
	handler.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/ping", nil))

	var resp model.PingResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "ok", resp.Status)
}

func TestLive(t *testing.T) {
	w := httptest.NewRecorder()
	Live(w, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	var resp model.PingResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "ok", resp.Status)
}

func TestReady(t *testing.T) {
	w := httptest.NewRecorder()
	Ready(w, httptest.NewRequest(http.MethodGet, "/readyz", nil))

	var resp map[string]any
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "ok", resp["status"])
}

func TestEcho_Valid(t *testing.T) {
	body := `{"name":"test","email":"t@t.com","age":25,"address":{"street":"123 Main","city":"NYC","zip":"10001"},"tags":["a"],"metadata":{"k":"v"}}`
	r := httptest.NewRequest(http.MethodPost, "/api/echo", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	Echo(w, r)

	var resp model.EchoResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "test", resp.Echo.Name)
}

func TestEcho_Invalid(t *testing.T) {
	body := `{"name":"","email":"bad"}`
	r := httptest.NewRequest(http.MethodPost, "/api/echo", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	Echo(w, r)

	var resp model.ErrorResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 422, w.Code)
	assert.Contains(t, resp.Error, "Name")
}

func TestValidate_Valid(t *testing.T) {
	body := `{"name":"test","email":"t@t.com","age":25,"address":{"street":"123 Main","city":"NYC","zip":"10001"},"tags":["a"],"metadata":{"k":"v"}}`
	r := httptest.NewRequest(http.MethodPost, "/api/validate", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	Validate(w, r)

	var resp model.ValidateResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	assert.True(t, resp.Valid)
}

func TestAuth_SignUp_Success(t *testing.T) {
	h := setupAuthHandler(t)
	body := `{"email":"a@b.com","password":"password123","name":"Test"}`
	r := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SignUp(w, r)

	var resp model.AuthResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 201, w.Code)
	require.NotNil(t, resp.User)
	assert.Equal(t, "a@b.com", resp.User.Email)
	assert.Equal(t, "Test", resp.User.Name)
	assert.Equal(t, "volunteer", resp.User.Role)
}

func TestAuth_SignUp_Duplicate(t *testing.T) {
	h := setupAuthHandler(t)
	body := `{"email":"dup@b.com","password":"password123","name":"Test"}`
	r1 := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email", strings.NewReader(body))
	r1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	h.SignUp(w1, r1)
	assert.Equal(t, 201, w1.Code)

	r2 := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email", strings.NewReader(body))
	r2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	h.SignUp(w2, r2)

	assert.Equal(t, 409, w2.Code)
}

func TestAuth_SignIn_Success(t *testing.T) {
	h := setupAuthHandler(t)

	body := `{"email":"signin@b.com","password":"password123","name":"Test"}`
	r := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SignUp(w, r)
	assert.Equal(t, 201, w.Code)

	body = `{"email":"signin@b.com","password":"password123"}`
	r = httptest.NewRequest(http.MethodPost, "/api/auth/sign-in/email", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	h.SignIn(w, r)

	var resp model.AuthResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	require.NotNil(t, resp.User)
	assert.Equal(t, "signin@b.com", resp.User.Email)
	assert.NotEmpty(t, w.Header().Get("Set-Cookie"))
}

func TestAuth_SignIn_WrongPassword(t *testing.T) {
	h := setupAuthHandler(t)

	signupBody := `{"email":"badpw@b.com","password":"password123","name":"Test"}`
	r := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email", strings.NewReader(signupBody))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SignUp(w, r)
	assert.Equal(t, 201, w.Code)

	loginBody := `{"email":"badpw@b.com","password":"wrongpassword"}`
	r = httptest.NewRequest(http.MethodPost, "/api/auth/sign-in/email", strings.NewReader(loginBody))
	r.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	h.SignIn(w, r)

	var errResp model.ErrorResponse
	json.NewDecoder(w.Body).Decode(&errResp)
	assert.Equal(t, 401, w.Code)
	assert.Equal(t, "invalid email or password", errResp.Error)
}

func TestAuth_GetSession_WithValidSession(t *testing.T) {
	h := setupAuthHandler(t)

	signupBody := `{"email":"session@b.com","password":"password123","name":"Test"}`
	r := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email", strings.NewReader(signupBody))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SignUp(w, r)
	assert.Equal(t, 201, w.Code)

	loginBody := `{"email":"session@b.com","password":"password123"}`
	r = httptest.NewRequest(http.MethodPost, "/api/auth/sign-in/email", strings.NewReader(loginBody))
	r.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	h.SignIn(w, r)
	assert.Equal(t, 200, w.Code)
	cookie := w.Header().Get("Set-Cookie")

	r = httptest.NewRequest(http.MethodGet, "/api/auth/get-session", nil)
	r.Header.Set("Cookie", extractSessionID(cookie))
	w = httptest.NewRecorder()
	h.GetSession(w, r)

	var resp model.SessionResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	require.NotNil(t, resp.User)
	assert.Equal(t, "session@b.com", resp.User.Email)
}

func TestAuth_GetSession_WithoutSession(t *testing.T) {
	h := setupAuthHandler(t)
	r := httptest.NewRequest(http.MethodGet, "/api/auth/get-session", nil)
	w := httptest.NewRecorder()
	h.GetSession(w, r)

	var resp model.SessionResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, 200, w.Code)
	assert.Nil(t, resp.User)
}

func TestAuth_SignOut(t *testing.T) {
	h := setupAuthHandler(t)

	signupBody := `{"email":"signout@b.com","password":"password123","name":"Test"}`
	r := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email", strings.NewReader(signupBody))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SignUp(w, r)
	assert.Equal(t, 201, w.Code)

	loginBody := `{"email":"signout@b.com","password":"password123"}`
	r = httptest.NewRequest(http.MethodPost, "/api/auth/sign-in/email", strings.NewReader(loginBody))
	r.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	h.SignIn(w, r)
	assert.Equal(t, 200, w.Code)
	cookie := w.Header().Get("Set-Cookie")

	r = httptest.NewRequest(http.MethodPost, "/api/auth/sign-out", nil)
	r.Header.Set("Cookie", extractSessionID(cookie))
	w = httptest.NewRecorder()
	h.SignOut(w, r)

	var signOutResp model.SignOutResponse
	json.NewDecoder(w.Body).Decode(&signOutResp)
	assert.Equal(t, 200, w.Code)
	assert.True(t, signOutResp.Success)

	r = httptest.NewRequest(http.MethodGet, "/api/auth/get-session", nil)
	r.Header.Set("Cookie", extractSessionID(cookie))
	w = httptest.NewRecorder()
	h.GetSession(w, r)

	var sessResp model.SessionResponse
	json.NewDecoder(w.Body).Decode(&sessResp)
	assert.Nil(t, sessResp.User)
}

func extractSessionID(setCookie string) string {
	for _, part := range strings.Split(setCookie, ";") {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "SESSION_ID=") {
			return part
		}
	}
	return ""
}
