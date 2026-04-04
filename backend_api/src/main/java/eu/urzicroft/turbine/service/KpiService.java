package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.dto.TurbineGraphPointDTO;
import eu.urzicroft.turbine.dto.TurbineHistoryProjection;
import eu.urzicroft.turbine.model.SensorData;
import eu.urzicroft.turbine.repository.SensorDataRepository;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiService {

    private final TurbineRepository turbineRepository;
    private final SensorDataRepository sensorDataRepository;

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

    private Double calculateAverageForType(List<SensorData> sensors, String type) {
        return sensors.stream()
                .filter(s -> type.equals(s.getSensorType()) && s.getCurrentValue() != null)
                .mapToDouble(SensorData::getCurrentValue)
                .average()
                .orElse(Double.NaN);
    }
}
