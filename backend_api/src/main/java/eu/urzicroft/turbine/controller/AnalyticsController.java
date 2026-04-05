package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.dto.FaultySensorDTO;
import eu.urzicroft.turbine.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PreAuthorize("@parkSecurity.canAccessTurbine(authentication, #turbineId)")
    @GetMapping("/turbines/{turbineId}/faulty-sensors")
    public List<FaultySensorDTO> getFaultySensors(
            @PathVariable String turbineId,
            @RequestParam(defaultValue = "24") int hoursBack) {

        return analyticsService.getFaultySensorsReport(turbineId, hoursBack);
    }

    @PreAuthorize("@parkSecurity.isParkTenant(authentication, #parkId)")
    @GetMapping("/parks/{parkId}/faulty-sensors")
    public Map<String, List<FaultySensorDTO>> getFaultyFromPark(
            @PathVariable String parkId,
            @RequestParam(defaultValue = "24") int hoursBack) {
        return analyticsService.getFaultySensorsReportForPark(parkId, hoursBack);
    }

    @PreAuthorize("@parkSecurity.canAccessTurbine(authentication, #turbineId)")
    @GetMapping("/turbines/{turbineId}/status")
    public Map<String, Object> getTurbineStatus(@PathVariable String turbineId) {
        return analyticsService.checkDiscrepancy(turbineId);
    }
}
