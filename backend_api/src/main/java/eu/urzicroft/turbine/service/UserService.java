package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.model.UserAccount;
import eu.urzicroft.turbine.repository.TurbineRepository;
import eu.urzicroft.turbine.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TurbineRepository turbineRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserAccount createTenant(String username, String rawPassword, String parkId) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        if (!turbineRepository.existsByParkId(parkId)) {
            throw new IllegalArgumentException("Cannot create tenant: Park ID '" + parkId + "' does not exist.");
        }

        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole("PARK_" + parkId);

        return userRepository.save(user);
    }
}
