package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.dto.ParkLocationDTO;
import eu.urzicroft.turbine.service.ParkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parks")
@RequiredArgsConstructor
public class ParkController {

    private final ParkService parkService;

    @GetMapping("/locations")
    public List<ParkLocationDTO> getParkLocations() {
        return parkService.getParkLocations();
    }
}
