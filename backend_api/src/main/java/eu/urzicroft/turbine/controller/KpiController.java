package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.dto.TurbineGraphPointDTO;
import eu.urzicroft.turbine.dto.TurbineMetricsDTO;
import eu.urzicroft.turbine.service.KpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/kpi")
@RequiredArgsConstructor
public class KpiController {

    private final KpiService kpiService;

    @PreAuthorize("@parkSecurity.canAccessTurbine(authentication, #turbineId)")
    @GetMapping("/{turbineId}/history")
    public List<TurbineGraphPointDTO> getTurbineHistory(
            @PathVariable String turbineId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return kpiService.getTurbineHistory(turbineId, start, end);
    }

    @GetMapping("/history/public")
    public Map<LocalDateTime, Double> getGlobalPublicHistory() {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(10);

        return kpiService.getGlobalPublicHistory(start, end);
    }

    @PreAuthorize("@parkSecurity.isParkTenant(authentication, #parkId)")
    @GetMapping("/{parkId}/metrics")
    public List<TurbineMetricsDTO> getParkMetrics(
            @PathVariable String parkId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return kpiService.getParkMetricsHistory(parkId, start, end);
    }
}
