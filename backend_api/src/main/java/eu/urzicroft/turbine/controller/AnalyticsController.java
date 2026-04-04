package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PreAuthorize("@parkSecurity.canAccessTurbine(authentication, #turbineId)")
    @GetMapping("/turbines/{turbineId}/status")
    public Map<String, Object> getTurbineStatus(@PathVariable String turbineId) {
        return analyticsService.checkDiscrepancy(turbineId);
    }
}
