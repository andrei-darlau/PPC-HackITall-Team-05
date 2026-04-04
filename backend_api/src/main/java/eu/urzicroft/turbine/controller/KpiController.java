package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.dto.KpiResponseDTO;
import eu.urzicroft.turbine.service.KpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpi")
@RequiredArgsConstructor
public class KpiController {

    private final KpiService kpiService;

    @GetMapping("/live")
    public List<KpiResponseDTO> getSemiLiveKpis() {
        return kpiService.getLatestKpis();
    }
}
