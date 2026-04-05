package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.model.MeteoData;
import eu.urzicroft.turbine.repository.MeteoDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeteoService {

    private final MeteoDataRepository meteoDataRepository;

    public Map<LocalDateTime, Double> getWindSpeedFallback(String turbineId, LocalDateTime start, LocalDateTime end) {
        List<MeteoData> meteoReadings = meteoDataRepository.getHistoryForTurbine(turbineId, start, end);

        // Filter out nulls and collect into a TreeMap to maintain chronological order
        return meteoReadings.stream()
                .filter(m -> m.getWindSpeedMean5min() != null)
                .collect(Collectors.toMap(
                        MeteoData::getTimestamp,
                        MeteoData::getWindSpeedMean5min,
                        (existing, replacement) -> existing,
                        TreeMap::new
                ));
    }
}
