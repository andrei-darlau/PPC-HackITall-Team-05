package eu.urzicroft.turbine.security;

import eu.urzicroft.turbine.model.Turbine;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("parkSecurity")
@RequiredArgsConstructor
public class ParkSecurityEvaluator {

    private final TurbineRepository turbineRepository;

    public boolean canAccessTurbine(Authentication authentication, String turbineId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

        if (isAdmin) {
            return true;
        }

        Turbine turbine = turbineRepository.findById(turbineId).orElse(null);
        if (turbine == null) {
            return false;
        }

        String targetParkId = turbine.getParkId();
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> ("PARK_" + targetParkId).equals(auth.getAuthority()));
    }
}
