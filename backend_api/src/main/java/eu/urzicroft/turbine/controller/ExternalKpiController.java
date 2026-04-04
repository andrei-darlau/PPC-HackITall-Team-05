package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.repository.SensorDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/external")
@RequiredArgsConstructor
public class ExternalKpiController {

    private final SensorDataRepository sensorDataRepository;

    @GetMapping("/turbines/{turbineId}/active-power")
    public Double getRecentActivePower(@PathVariable String turbineId) {
        // Fetch average active power for the last 15 minutes
        LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);
        Double value = sensorDataRepository.getAverageValueSince(turbineId, "act_pwt", fifteenMinsAgo);
        return value != null ? value : 0.0;
    }
}
