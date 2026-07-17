package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/green-algeria-map/backend-go/internal/email"
	"github.com/green-algeria-map/backend-go/internal/server"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func setupPostgresContainer(t *testing.T) (*postgres.PostgresContainer, string) {
	t.Helper()

	ctx := context.Background()
	container, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("greenalgeria"),
		postgres.WithUsername("greenalgeria"),
		postgres.WithPassword("greenalgeria"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(30*time.Second),
		),
	)
	require.NoError(t, err)

	connStr, err := container.ConnectionString(ctx)
	require.NoError(t, err)

	// Apply migrations
	runMigrations(t, connStr)

	return container, connStr
}

func runMigrations(t *testing.T, connStr string) {
	t.Helper()
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, connStr)
	require.NoError(t, err)
	defer pool.Close()

	// Get the project root directory
	wd, err := os.Getwd()
	require.NoError(t, err)
	projectRoot := wd[:len(wd)-len("/integration")]

	// Read migration files from project root
	migrations := []string{
		projectRoot + "/migrations/001_init.sql",
		projectRoot + "/migrations/002_add_zone_indexes.sql",
		projectRoot + "/migrations/003_add_zone_photos.sql",
		projectRoot + "/migrations/004_betterauth_schema.sql",
		projectRoot + "/migrations/005_add_damage_report_fields.sql",
		projectRoot + "/migrations/006_add_zone_fields.sql",
		projectRoot + "/migrations/007_fix_damage_report_columns.sql",
	}

	for _, m := range migrations {
		content, err := os.ReadFile(m)
		require.NoErrorf(t, err, "failed to read migration %s", m)
		
		// Only execute the "Up" section (before "-- +goose Down")
		// Goose migrations have both Up and Down sections separated by "-- +goose Down"
		contentStr := string(content)
		if idx := strings.Index(contentStr, "-- +goose Down"); idx >= 0 {
			contentStr = contentStr[:idx]
		}
		
		// Remove goose comments and empty lines
		lines := strings.Split(contentStr, "\n")
		var cleanLines []string
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if trimmed == "" || strings.HasPrefix(trimmed, "--") {
				continue
			}
			cleanLines = append(cleanLines, line)
		}
		cleanContent := strings.Join(cleanLines, "\n")
		
		statements := strings.Split(cleanContent, ";")
		for i, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			t.Logf("Executing migration %s statement %d: %s", m, i, stmt[:min(150, len(stmt))])
			_, err = pool.Exec(ctx, stmt)
			require.NoErrorf(t, err, "failed to apply migration %s statement %d: %s", m, i, stmt[:min(150, len(stmt))])
		}
	}
}

func createTestServer(t *testing.T, connStr string) *server.Server {
	t.Helper()
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, connStr)
	require.NoError(t, err)

	cfg := server.Config{
		StoreType: "postgres",
		Pool:      pool,
	}
	srv := server.New(cfg)
	return srv
}

func makeRequest(t *testing.T, srv *server.Server, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.Router.ServeHTTP(w, req)
	return w
}

func makeAuthenticatedRequest(t *testing.T, srv *server.Server, method, path, body, sessionCookie string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if sessionCookie != "" {
		req.Header.Set("Cookie", "better-auth.session_token="+sessionCookie)
	}
	w := httptest.NewRecorder()
	srv.Router.ServeHTTP(w, req)
	return w
}

func signUpAndSignIn(t *testing.T, srv *server.Server) string {
	t.Helper()
	signUpBody := `{"email":"auth-test@example.com","password":"password123","name":"Auth Test"}`
	w := makeRequest(t, srv, "POST", "/api/auth/sign-up/email", signUpBody)
	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("sign-up failed: %d - %s", w.Code, w.Body.String())
	}

	// AutoSignIn is enabled, so the sign-up response already carries a valid
	// session cookie. RequireAuth reads the better-auth.session_token cookie,
	// not a Bearer token.
	for _, c := range w.Result().Cookies() {
		if c.Name == "better-auth.session_token" {
			return c.Value
		}
	}
	t.Fatal("no session cookie in sign-up response")
	return ""
}

// verifyEmail triggers the verification email (go-better-auth does not
// auto-send on sign-up) and confirms the address via the verify-email endpoint,
// reading the token from the email captured by MOCK_EMAIL.
func verifyEmail(t *testing.T, srv *server.Server, emailAddr string) {
	t.Helper()
	// Trigger the verification email so MOCK_EMAIL captures it.
	sendBody := `{"email":"` + emailAddr + `"}`
	makeRequest(t, srv, "POST", "/api/auth/send-verification-email", sendBody)

	html := email.LastSentHTML()
	re := regexp.MustCompile(`token=([^"&\s<]+)`)
	m := re.FindStringSubmatch(html)
	if len(m) < 2 {
		t.Fatalf("could not find verification token in email: %q", html)
	}
	w := makeRequest(t, srv, "GET", "/api/auth/verify-email?token="+m[1], "")
	if w.Code != http.StatusOK {
		t.Fatalf("email verification failed: %d - %s", w.Code, w.Body.String())
	}
}

func TestDamageReport_CreateAndList(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer container.Terminate(context.Background())

	srv := createTestServer(t, connStr)

	// Create a zone first
	zoneBody := `{"name":"Test Zone","type":"planting","status":"planned","lat":36.0,"lng":3.0,"description":"Test zone"}`
	w := makeRequest(t, srv, "POST", "/api/zones", zoneBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var zone map[string]interface{}
	json.NewDecoder(w.Body).Decode(&zone)
	zoneID := zone["id"].(string)

	// Create damage report
	drBody := fmt.Sprintf(`{"zoneId":"%s","title":"Fire Damage","description":"Forest fire","severity":"high","type":"fire","status":"reported","lat":36.0,"lng":3.0,"reportedBy":"test-user"}`, zoneID)
	w = makeRequest(t, srv, "POST", "/api/damage-reports", drBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var createdDR map[string]interface{}
	json.NewDecoder(w.Body).Decode(&createdDR)
	assert.Equal(t, "Fire Damage", createdDR["title"])
	assert.Equal(t, "reported", createdDR["status"])
	assert.Equal(t, "fire", createdDR["type"])
	drID := createdDR["id"].(string)

	// List damage reports
	w = makeRequest(t, srv, "GET", "/api/damage-reports", "")
	assert.Equal(t, http.StatusOK, w.Code)

	var listResponse map[string]interface{}
	json.NewDecoder(w.Body).Decode(&listResponse)
	reports := listResponse["reports"].([]interface{})
	assert.Len(t, reports, 1)
	assert.Equal(t, drID, reports[0].(map[string]interface{})["id"])

	// Get by ID
	w = makeRequest(t, srv, "GET", "/api/damage-reports/"+drID, "")
	assert.Equal(t, http.StatusOK, w.Code)

	var getResponse map[string]interface{}
	json.NewDecoder(w.Body).Decode(&getResponse)
	assert.Equal(t, drID, getResponse["id"])
}

func TestDamageReport_UpdateStatus(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer container.Terminate(context.Background())

	srv := createTestServer(t, connStr)
	token := signUpAndSignIn(t, srv)

	// Create a zone first
	zoneBody := `{"name":"Test Zone","type":"planting","status":"planned","lat":36.0,"lng":3.0,"description":"Test zone"}`
	w := makeRequest(t, srv, "POST", "/api/zones", zoneBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var zone map[string]interface{}
	json.NewDecoder(w.Body).Decode(&zone)
	zoneID := zone["id"].(string)

	// Create damage report
	drBody := fmt.Sprintf(`{"zoneId":"%s","title":"Fire Damage","description":"Forest fire","severity":"high","type":"fire","status":"reported","lat":36.0,"lng":3.0,"reportedBy":"test-user"}`, zoneID)
	w = makeRequest(t, srv, "POST", "/api/damage-reports", drBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var createdDR map[string]interface{}
	json.NewDecoder(w.Body).Decode(&createdDR)
	drID := createdDR["id"].(string)
	assert.Equal(t, "reported", createdDR["status"])

	// Update status to verified
	updateBody := `{"status":"verified"}`
	w = makeAuthenticatedRequest(t, srv, "PATCH", "/api/damage-reports/"+drID+"/status", updateBody, token)
	assert.Equal(t, http.StatusOK, w.Code)

	var updatedDR map[string]interface{}
	json.NewDecoder(w.Body).Decode(&updatedDR)
	assert.Equal(t, "verified", updatedDR["status"])
}

func TestDamageReport_Delete(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer container.Terminate(context.Background())

	srv := createTestServer(t, connStr)
	token := signUpAndSignIn(t, srv)

	// Create a zone first
	zoneBody := `{"name":"Test Zone","type":"planting","status":"planned","lat":36.0,"lng":3.0,"description":"Test zone"}`
	w := makeRequest(t, srv, "POST", "/api/zones", zoneBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var zone map[string]interface{}
	json.NewDecoder(w.Body).Decode(&zone)
	zoneID := zone["id"].(string)

	// Create damage report
	drBody := fmt.Sprintf(`{"zoneId":"%s","title":"Fire Damage","description":"Forest fire","severity":"high","type":"fire","status":"reported","lat":36.0,"lng":3.0,"reportedBy":"test-user"}`, zoneID)
	w = makeRequest(t, srv, "POST", "/api/damage-reports", drBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var createdDR map[string]interface{}
	json.NewDecoder(w.Body).Decode(&createdDR)
	drID := createdDR["id"].(string)

	// Delete damage report
	w = makeAuthenticatedRequest(t, srv, "DELETE", "/api/damage-reports/"+drID, "", token)
	assert.Equal(t, http.StatusNoContent, w.Code)

	// Verify it's gone
	w = makeRequest(t, srv, "GET", "/api/damage-reports/"+drID, "")
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestDamageReport_FilterByZoneID(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer container.Terminate(context.Background())

	srv := createTestServer(t, connStr)

	// Create two zones
	zone1Body := `{"name":"Zone 1","type":"planting","status":"planned","lat":36.0,"lng":3.0,"description":"Zone 1"}`
	w := makeRequest(t, srv, "POST", "/api/zones", zone1Body)
	assert.Equal(t, http.StatusCreated, w.Code)
	var zone1 map[string]interface{}
	json.NewDecoder(w.Body).Decode(&zone1)
	zone1ID := zone1["id"].(string)

	zone2Body := `{"name":"Zone 2","type":"planting","status":"planned","lat":37.0,"lng":4.0,"description":"Zone 2"}`
	w = makeRequest(t, srv, "POST", "/api/zones", zone2Body)
	assert.Equal(t, http.StatusCreated, w.Code)
	var zone2 map[string]interface{}
	json.NewDecoder(w.Body).Decode(&zone2)
	zone2ID := zone2["id"].(string)

	// Create damage report in zone 1
	dr1Body := fmt.Sprintf(`{"zoneId":"%s","title":"Damage in Zone 1","description":"Fire","severity":"high","type":"fire","status":"reported","lat":36.0,"lng":3.0,"reportedBy":"test-user"}`, zone1ID)
	w = makeRequest(t, srv, "POST", "/api/damage-reports", dr1Body)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Create damage report in zone 2
	dr2Body := fmt.Sprintf(`{"zoneId":"%s","title":"Damage in Zone 2","description":"Disease","severity":"medium","type":"disease","status":"reported","lat":37.0,"lng":4.0,"reportedBy":"test-user"}`, zone2ID)
	w = makeRequest(t, srv, "POST", "/api/damage-reports", dr2Body)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Filter by zone 1
	w = makeRequest(t, srv, "GET", "/api/damage-reports?zoneId="+zone1ID, "")
	assert.Equal(t, http.StatusOK, w.Code)
	var listResponse map[string]interface{}
	json.NewDecoder(w.Body).Decode(&listResponse)
	reports := listResponse["reports"].([]interface{})
	assert.Len(t, reports, 1)
	assert.Equal(t, "Damage in Zone 1", reports[0].(map[string]interface{})["title"])

	// Filter by zone 2
	w = makeRequest(t, srv, "GET", "/api/damage-reports?zoneId="+zone2ID, "")
	assert.Equal(t, http.StatusOK, w.Code)
	json.NewDecoder(w.Body).Decode(&listResponse)
	reports = listResponse["reports"].([]interface{})
	assert.Len(t, reports, 1)
	assert.Equal(t, "Damage in Zone 2", reports[0].(map[string]interface{})["title"])
}

func TestZone_NestedDamageReports(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer container.Terminate(context.Background())

	srv := createTestServer(t, connStr)

	// Create a zone
	zoneBody := `{"name":"Test Zone","type":"planting","status":"planned","lat":36.0,"lng":3.0,"description":"Test zone"}`
	w := makeRequest(t, srv, "POST", "/api/zones", zoneBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var zone map[string]interface{}
	json.NewDecoder(w.Body).Decode(&zone)
	zoneID := zone["id"].(string)

	// Create damage report in that zone
	drBody := fmt.Sprintf(`{"zoneId":"%s","title":"Zone Damage","description":"Fire in zone","severity":"high","type":"fire","status":"reported","lat":36.0,"lng":3.0,"reportedBy":"test-user"}`, zoneID)
	w = makeRequest(t, srv, "POST", "/api/damage-reports", drBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Use nested route to get damage reports for zone
	w = makeRequest(t, srv, "GET", "/api/zones/"+zoneID+"/damage-reports", "")
	assert.Equal(t, http.StatusOK, w.Code)

	var listResponse map[string]interface{}
	json.NewDecoder(w.Body).Decode(&listResponse)
	reports := listResponse["reports"].([]interface{})
	assert.Len(t, reports, 1)
	assert.Equal(t, "Zone Damage", reports[0].(map[string]interface{})["title"])
}

func TestZone_PATCHNotPUT(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer container.Terminate(context.Background())

	srv := createTestServer(t, connStr)
	token := signUpAndSignIn(t, srv)

	// Create a zone
	zoneBody := `{"name":"Test Zone","type":"planting","status":"planned","lat":36.0,"lng":3.0,"description":"Test zone"}`
	w := makeRequest(t, srv, "POST", "/api/zones", zoneBody)
	assert.Equal(t, http.StatusCreated, w.Code)

	var zone map[string]interface{}
	json.NewDecoder(w.Body).Decode(&zone)
	zoneID := zone["id"].(string)

	// Try PATCH (should work)
	updateBody := `{"name":"Updated Zone","type":"planting","status":"in-progress","lat":36.0,"lng":3.0,"description":"Updated"}`
	w = makeAuthenticatedRequest(t, srv, "PATCH", "/api/zones/"+zoneID, updateBody, token)
	assert.Equal(t, http.StatusOK, w.Code)

	var updatedZone map[string]interface{}
	json.NewDecoder(w.Body).Decode(&updatedZone)
	assert.Equal(t, "Updated Zone", updatedZone["name"])

	// Try PUT (should 404 or not work)
	w = makeRequest(t, srv, "PUT", "/api/zones/"+zoneID, updateBody)
	assert.NotEqual(t, http.StatusOK, w.Code) // Should fail or return 405
}

func TestAuth_SignUpSignIn(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer container.Terminate(context.Background())

	srv := createTestServer(t, connStr)

	// Test sign up
	signUpBody := `{"email":"test@example.com","password":"password123","name":"Test User"}`
	w := makeRequest(t, srv, "POST", "/api/auth/sign-up/email", signUpBody)
	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Logf("Sign up response: %d - %s", w.Code, w.Body.String())
	}
	assert.Equal(t, http.StatusOK, w.Code)

	var signUpResponse map[string]interface{}
	json.NewDecoder(w.Body).Decode(&signUpResponse)
	assert.NotNil(t, signUpResponse["user"])
	user := signUpResponse["user"].(map[string]interface{})
	assert.Equal(t, "test@example.com", user["email"])
	assert.Equal(t, "Test User", user["name"])

	// Email verification is required before sign-in; confirm via the
	// verification email captured by MOCK_EMAIL.
	verifyEmail(t, srv, "test@example.com")

	// Test sign in
	signInBody := `{"email":"test@example.com","password":"password123"}`
	w = makeRequest(t, srv, "POST", "/api/auth/sign-in/email", signInBody)
	assert.Equal(t, http.StatusOK, w.Code)

	var signInResponse map[string]interface{}
	json.NewDecoder(w.Body).Decode(&signInResponse)
	assert.NotNil(t, signInResponse["user"])

	// Test get session using the session cookie from sign-in.
	var sessionCookie string
	for _, c := range w.Result().Cookies() {
		if c.Name == "better-auth.session_token" {
			sessionCookie = c.Value
			break
		}
	}
	require.NotEmpty(t, sessionCookie)
	w = makeAuthenticatedRequest(t, srv, "GET", "/api/auth/get-session", "", sessionCookie)
	assert.Equal(t, http.StatusOK, w.Code)
	var sessionResp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&sessionResp)
	assert.NotNil(t, sessionResp["user"])
}