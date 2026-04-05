package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.dto.ParkLocationDTO;
import eu.urzicroft.turbine.model.Turbine;
import eu.urzicroft.turbine.service.ParkService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parks")
@RequiredArgsConstructor
public class ParkController {

    private final ParkService parkService;

    @GetMapping
    public List<String> getAllParks() {
        return parkService.getAllParkIds();
    }

    @GetMapping("/locations")
    public List<ParkLocationDTO> getParkLocations() {
        return parkService.getParkLocations();
    }

    @PreAuthorize("@parkSecurity.isParkTenant(authentication, #parkId)")
    @GetMapping("/{parkId}/turbines")
    public List<Turbine> getTurbinesByParkId(@PathVariable String parkId) {
        return parkService.getTurbinesByParkId(parkId);
    }

    @GetMapping("/{parkId}/radius")
    public Double getParkRadius(@PathVariable String parkId) {
        return parkService.getParkRadius(parkId);
    }
}
