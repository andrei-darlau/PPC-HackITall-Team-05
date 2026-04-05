package eu.urzicroft.turbine.controller;

import eu.urzicroft.turbine.dto.TenantCreationDTO;
import eu.urzicroft.turbine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
     private final UserService userService;

    @PostMapping("/tenants")
    public ResponseEntity<Map<String, String>> createTenant(@RequestBody TenantCreationDTO request) {
        String assignedRole = request.getParkId();

         userService.createTenant(request.getUsername(), request.getPassword(), assignedRole);

        return ResponseEntity.ok(Map.of("message", "Successfully created tenant " + request.getUsername()));
    }
}
