package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.event.TurbineDataChangedEvent;
import eu.urzicroft.turbine.model.Turbine;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.parquet.example.data.Group;
import org.apache.parquet.hadoop.ParquetReader;
import org.apache.parquet.hadoop.example.GroupReadSupport;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TurbineSyncService {

    private final S3Client s3Client;
    private final TurbineRepository turbineRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final String BUCKET_NAME = "ppcro-rr-noprod-app00176-development-s3-2";
    private static final String PREFIX = "RAW/streaming/hackathon_wtg_data/";

    public String refreshTurbinesFromS3() {
        log.info("Starting S3 Turbine Sync (Parquet Edition)...");

        List<Turbine> s3Turbines = fetchTurbinesFromS3();
        if (s3Turbines.isEmpty()) {
            return "No data found in S3 to sync.";
        }

        List<Turbine> dbTurbines = turbineRepository.findAll();
        boolean hasChanges = syncDatabase(s3Turbines, dbTurbines);

        if (hasChanges) {
            log.info("Changes detected! Publishing cache invalidation event...");
            eventPublisher.publishEvent(new TurbineDataChangedEvent(this));
            return "Sync complete: Changes detected and caches invalidated.";
        }

        return "Sync complete: No changes detected.";
    }

    private List<Turbine> fetchTurbinesFromS3() {
        List<Turbine> parsedTurbines = new ArrayList<>();
        Configuration hadoopConf = new Configuration();

        hadoopConf.set("fs.file.impl", org.apache.hadoop.fs.LocalFileSystem.class.getName());

        ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                .bucket(BUCKET_NAME)
                .prefix(PREFIX)
                .build();

        ListObjectsV2Response listRes = s3Client.listObjectsV2(listReq);

        for (S3Object s3Object : listRes.contents()) {
            if (!s3Object.key().endsWith(".parquet")) continue;

            File tempFile = null;
            try {
                tempFile = File.createTempFile("turbines_raw_", ".parquet");
                tempFile.delete();

                GetObjectRequest getReq = GetObjectRequest.builder()
                        .bucket(BUCKET_NAME)
                        .key(s3Object.key())
                        .build();

                log.info("Downloading {} to temp file...", s3Object.key());
                // 3. AWS SDK will now successfully write the downloaded file here
                s3Client.getObject(getReq, ResponseTransformer.toFile(tempFile));

                Path path = new Path(tempFile.getAbsolutePath());
                try (ParquetReader<Group> reader = ParquetReader.builder(new GroupReadSupport(), path)
                        .withConf(hadoopConf)
                        .build()) {

                    Group group;
                    while ((group = reader.read()) != null) {
                        Turbine t = new Turbine();

                        t.setId(safeGetString(group, "fk_turbine_id"));
                        t.setWtgModelId(safeGetString(group, "fk_wtg_model_id"));
                        t.setParkId(safeGetString(group, "fk_park_id"));
                        t.setLatY(safeGetDouble(group, "lat_y"));
                        t.setLongX(safeGetDouble(group, "long_x"));

                        parsedTurbines.add(t);
                    }
                }
            } catch (Exception e) {
                log.error("Error reading Parquet file {} from S3", s3Object.key(), e);
            } finally {
                if (tempFile != null && tempFile.exists()) {
                    try {
                        Files.delete(tempFile.toPath());
                    } catch (Exception e) {
                        log.warn("Failed to delete temp file {}", tempFile.getAbsolutePath());
                    }
                }
            }
        }
        return parsedTurbines;
    }

    private String safeGetString(Group group, String fieldName) {
        try {
            return group.getString(fieldName, 0);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private double safeGetDouble(Group group, String fieldName) {
        try {
            return group.getDouble(fieldName, 0);
        } catch (RuntimeException e) {
            try {
                return group.getFloat(fieldName, 0);
            } catch (RuntimeException ex) {
                return 0.0;
            }
        }
    }

    private boolean syncDatabase(List<Turbine> s3Turbines, List<Turbine> dbTurbines) {
        boolean changed = false;

        Map<String, Turbine> dbMap = dbTurbines.stream()
                .collect(Collectors.toMap(Turbine::getId, Function.identity()));

        List<Turbine> toSave = new ArrayList<>();

        for (Turbine s3t : s3Turbines) {
            Turbine dbt = dbMap.get(s3t.getId());
            if (dbt == null || !dbt.equals(s3t)) {
                toSave.add(s3t);
                changed = true;
            }
            dbMap.remove(s3t.getId());
        }

        if (!dbMap.isEmpty()) {
            turbineRepository.deleteAll(dbMap.values());
            changed = true;
        }

        if (!toSave.isEmpty()) {
            turbineRepository.saveAll(toSave);
        }

        return changed;
    }
}
