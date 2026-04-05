package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.dto.FaultySensorDTO;
import eu.urzicroft.turbine.model.RejectedData;
import eu.urzicroft.turbine.repository.MeteoDataRepository;
import eu.urzicroft.turbine.repository.RejectedDataRepository;
import eu.urzicroft.turbine.repository.SensorDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final SensorDataRepository sensorDataRepository;
    private final MeteoDataRepository meteoDataRepository;
    private final RejectedDataRepository rejectedDataRepository;

    public List<FaultySensorDTO> getFaultySensorsReport(String turbineId, int hoursBack) {
        LocalDateTime since = LocalDateTime.now().minusHours(hoursBack);
        List<RejectedData> rejections = rejectedDataRepository
                .findByTurbineIdAndTimestampAfterOrderByTimestampDesc(turbineId, since);

        return rejections.stream()
                .collect(Collectors.groupingBy(RejectedData::getSensorType))
                .entrySet().stream()
                .map(entry -> {
                    RejectedData latestRejection = entry.getValue().getFirst();

                    return FaultySensorDTO.builder()
                            .sensorType(entry.getKey())
                            .rejectionCount(entry.getValue().size()) // How many times it failed in this timeframe
                            .latestRejectionReason(latestRejection.getRejectionReason())
                            .latestRejectedAt(latestRejection.getTimestamp())
                            .build();
                })
                .toList();
    }

    public Map<String, Object> checkDiscrepancy(String turbineId) {
        LocalDateTime hourAgo = LocalDateTime.now().minusHours(1);

        Double avgWind = meteoDataRepository.getAverageWindSpeedSince(turbineId, hourAgo);
        Double avgPower = sensorDataRepository.getAverageValueSince(turbineId, "act_pwt", hourAgo);

        Map<String, Object> status = new HashMap<>();
        status.put("turbineId", turbineId);
        status.put("highWindLowOutput", (avgWind != null && avgWind > 12.0) && (avgPower != null && avgPower < 0.5));
        status.put("isOffline", avgPower == null);

        return status;
    }
}
