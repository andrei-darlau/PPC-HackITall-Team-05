package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.dto.KpiResponseDTO;
import eu.urzicroft.turbine.model.Turbine;
import eu.urzicroft.turbine.repository.SensorDataRepository;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KpiService {

    private final TurbineRepository turbineRepository;
    private final SensorDataRepository sensorDataRepository;

    @Cacheable("kpis")
    public List<KpiResponseDTO> getLatestKpis() {
        return calculateKpis();
    }

    @CachePut("kpis")
    public List<KpiResponseDTO> refreshKpis() {
        return calculateKpis();
    }

    private List<KpiResponseDTO> calculateKpis() {
        List<KpiResponseDTO> kpis = new ArrayList<>();
        List<Turbine> turbines = turbineRepository.findAll();
        LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);

        for (Turbine t : turbines) {
            Double avgPower = sensorDataRepository.getAverageValueSince(t.getId(), "act_pwt", fifteenMinsAgo);
            Double avgTemp = sensorDataRepository.getAverageValueSince(t.getId(), "turbine_t", fifteenMinsAgo);
            Double avgWind = sensorDataRepository.getAverageValueSince(t.getId(), "wd_spd", fifteenMinsAgo);

            kpis.add(KpiResponseDTO.builder()
                    .turbineId(t.getId())
                    .parkId(t.getParkId())
                    .timestamp(LocalDateTime.now())
                    .activePower(avgPower != null ? avgPower : 0.0)
                    .ambientTemp(avgTemp != null ? avgTemp : 0.0)
                    .windSpeed(avgWind != null ? avgWind : 0.0)
                    .build());
        }
        return kpis;
    }
}
