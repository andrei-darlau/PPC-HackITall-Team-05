package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.service.MeteoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/meteo")
@RequiredArgsConstructor
public class MeteoController {

    private final MeteoService meteoService;

    @PreAuthorize("@parkSecurity.canAccessTurbine(authentication, #turbineId)")
    @GetMapping("/turbines/{turbineId}/wind-speed-fallback")
    public Map<LocalDateTime, Double> getWindSpeedFallback(
            @PathVariable String turbineId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return meteoService.getWindSpeedFallback(turbineId, start, end);
    }
}
