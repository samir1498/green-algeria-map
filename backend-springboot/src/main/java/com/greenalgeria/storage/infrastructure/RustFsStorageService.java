package com.greenalgeria.storage.infrastructure;

import com.greenalgeria.storage.domain.StorageProperties;
import com.greenalgeria.storage.domain.StorageService;
import java.net.URI;
import java.util.UUID;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class RustFsStorageService implements StorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String endpoint;

    public RustFsStorageService(StorageProperties props) {
        this.bucket = props.getBucket();
        this.endpoint = props.getEndpoint();
        var credentials = AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey());
        this.s3Client = S3Client.builder()
                .region(Region.of(props.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .endpointOverride(URI.create(props.getEndpoint()))
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Override
    public UploadResult uploadFile(byte[] file, String filename, String mimetype) {
        var fileId = UUID.randomUUID() + "-" + filename;
        var putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(fileId)
                .contentType(mimetype)
                .build();
        s3Client.putObject(putRequest, RequestBody.fromBytes(file));
        var url = endpoint + "/" + bucket + "/" + fileId;
        return new UploadResult(fileId, url);
    }
}
