package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.repository.MeteoDataRepository;
import eu.urzicroft.turbine.repository.SensorDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final SensorDataRepository sensorDataRepository;
    private final MeteoDataRepository meteoDataRepository;

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
