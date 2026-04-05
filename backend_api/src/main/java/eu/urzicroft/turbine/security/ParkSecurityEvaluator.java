package eu.urzicroft.turbine.security;

import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("parkSecurity")
@RequiredArgsConstructor
public class ParkSecurityEvaluator {

    private final TurbineRepository turbineRepository;

    public boolean isParkTenant(Authentication authentication, String parkId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

        if (isAdmin) {
            return true;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(auth -> ("PARK_" + parkId).equals(auth.getAuthority()));
    }

    public boolean canAccessTurbine(Authentication authentication, String turbineId) {
        return turbineRepository
                .findById(turbineId)
                .map(t -> isParkTenant(authentication, t.getParkId()))
                .orElse(false);
    }
}
