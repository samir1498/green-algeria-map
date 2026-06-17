package handler

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUploadZonePhoto_MaxSizeExceeded(t *testing.T) {
	h := &StorageHandler{}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "test.jpg")
	part.Write(bytes.Repeat([]byte("a"), 6<<20))
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	rr := httptest.NewRecorder()
	h.UploadZonePhoto(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestUploadZonePhoto_NoFile(t *testing.T) {
	h := &StorageHandler{}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	rr := httptest.NewRecorder()
	h.UploadZonePhoto(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}
