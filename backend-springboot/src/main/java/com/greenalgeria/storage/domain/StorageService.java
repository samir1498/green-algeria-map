package com.greenalgeria.storage.domain;

public interface StorageService {
    UploadResult uploadFile(byte[] file, String filename, String mimetype);

    record UploadResult(String fileId, String url) {}
}
