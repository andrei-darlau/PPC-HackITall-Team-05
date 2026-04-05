package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.dto.TurbineGraphPointDTO;
import eu.urzicroft.turbine.dto.TurbineHistoryProjection;
import eu.urzicroft.turbine.dto.TurbineMetricsDTO;
import eu.urzicroft.turbine.repository.SensorDataRepository;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiService {

    private final TurbineRepository turbineRepository;
    private final SensorDataRepository sensorDataRepository;
    private final CacheManager cacheManager; // Inject Caffeine CacheManager

    public List<TurbineGraphPointDTO> getTurbineHistory(
            String turbineId,
            LocalDateTime start,
            LocalDateTime end) {
        return sensorDataRepository.getAggregatedHistoryForTurbine(turbineId, start, end)
                .stream()
                .map(proj -> TurbineGraphPointDTO.builder()
                        .timeBucket(proj.getTimeBucket())
                        .activePower("act_pwt".equals(proj.getSensorType()) ? proj.getAverageValue() : null)
                        .windSpeed("wd_spd".equals(proj.getSensorType()) ? proj.getAverageValue() : null)
                        .ambientTemp("turbine_t".equals(proj.getSensorType()) ? proj.getAverageValue() : null)
                        .build())
                .toList();
    }

    public List<TurbineMetricsDTO> getParkMetricsHistory(
            String parkId,
            LocalDateTime start,
            LocalDateTime end) {

        // "parkMetricsBuckets" cache automatically via CaffeineCacheManager on first use
        Cache cache = cacheManager.getCache("parkMetricsBuckets");
        List<TurbineMetricsDTO> result = new ArrayList<>();
        List<LocalDateTime> missingBuckets = new ArrayList<>();

        LocalDateTime currentBucket = start.truncatedTo(ChronoUnit.HOURS)
                .plusMinutes(15 * (start.getMinute() / 15));

        while (!currentBucket.isAfter(end)) {
            String cacheKey = parkId + "_" + currentBucket;
            TurbineMetricsDTO cachedDto = cache != null ? cache.get(cacheKey, TurbineMetricsDTO.class) : null;

            if (cachedDto != null) {
                result.add(cachedDto);
            } else {
                missingBuckets.add(currentBucket);
            }
            currentBucket = currentBucket.plusMinutes(15);
        }

        if (!missingBuckets.isEmpty()) {
            LocalDateTime queryStart = missingBuckets.getFirst();
            LocalDateTime queryEnd = missingBuckets.getLast().plusMinutes(15); // cover the final bucket

            List<TurbineHistoryProjection> projections = sensorDataRepository.getAggregatedHistoryForPark(parkId, queryStart, queryEnd);

            List<TurbineMetricsDTO> dbResults = projections.stream()
                    .collect(Collectors.groupingBy(TurbineHistoryProjection::getTimeBucket))
                    .entrySet().stream()
                    .map(entry -> {
                        LocalDateTime bucket = entry.getKey();
                        TurbineMetricsDTO.TurbineMetricsDTOBuilder builder = TurbineMetricsDTO.builder().timeBucket(bucket);

                        for (TurbineHistoryProjection proj : entry.getValue()) {
                            if (proj.getAverageValue() == null) continue;
                            switch (proj.getSensorType()) {
                                case "act_pwt" -> builder.activePower(proj.getAverageValue());
                                case "wd_spd" -> builder.windSpeed(proj.getAverageValue());
                                case "conv_t" -> builder.converterTemp(proj.getAverageValue());
                                case "gearbox_t" -> builder.gearboxTemp(proj.getAverageValue());
                                case "gen1_t" -> builder.gen1Temp(proj.getAverageValue());
                                case "gen2_t" -> builder.gen2Temp(proj.getAverageValue());
                                case "transformer_t" -> builder.transformerTemp(proj.getAverageValue());
                                case "turbine_t" -> builder.ambientTemp(proj.getAverageValue());
                            }
                        }
                        return builder.build();
                    })
                    .toList();

            // cache results for future requests
            LocalDateTime now = LocalDateTime.now();
            for (TurbineMetricsDTO dto : dbResults) {
                result.add(dto);
                if (cache != null && dto.getTimeBucket().isBefore(now.minusMinutes(15))) {
                    String cacheKey = parkId + "_" + dto.getTimeBucket().toString();
                    cache.put(cacheKey, dto);
                }
            }
        }

        // ensure chronological order before returning
        result.sort(Comparator.comparing(TurbineMetricsDTO::getTimeBucket));
        return result;
    }

    public Map<LocalDateTime, Double> getGlobalPublicHistory(LocalDateTime start, LocalDateTime end) {
        return sensorDataRepository.getGlobalActivePowerHistory(start, end)
                .stream()
                .collect(Collectors.toMap(
                        TurbineHistoryProjection::getTimeBucket,
                        TurbineHistoryProjection::getAverageValue,
                        (existing, replacement) -> existing,
                        TreeMap::new
                ));
    }
}
