package com.greenalgeria.storage.infrastructure;

import com.greenalgeria.storage.domain.StorageProperties;
import java.net.URI;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Component
public class StorageHealthIndicator implements HealthIndicator {

    private final StorageProperties props;

    public StorageHealthIndicator(StorageProperties props) {
        this.props = props;
    }

    @Override
    public Health health() {
        var credentials = AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey());
        try (var client = S3Client.builder()
                .region(Region.of(props.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .endpointOverride(URI.create(props.getEndpoint()))
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build()) {
            client.headBucket(req -> req.bucket(props.getBucket()));
            return Health.up().withDetail("bucket", props.getBucket()).build();
        } catch (Exception e) {
            return Health.down(e).withDetail("bucket", props.getBucket()).build();
        }
    }
}
