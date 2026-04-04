package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.service.TurbineSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
public class SyncController {

    private final TurbineSyncService turbineSyncService;

    @PostMapping("/turbines")
    public String syncTurbines() {
        return turbineSyncService.refreshTurbinesFromS3();
    }
}
