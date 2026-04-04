package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.dto.TenantCreationDTO;
import eu.urzicroft.turbine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
     private final UserService userService;

    @PostMapping("/tenants")
    public String createTenant(@RequestBody TenantCreationDTO request) {
        String assignedRole = "PARK_" + request.getParkId();

         userService.createTenant(request.getUsername(), request.getPassword(), assignedRole);

        return "Successfully created tenant " + request.getUsername() + " with access to " + request.getParkId();
    }
}
