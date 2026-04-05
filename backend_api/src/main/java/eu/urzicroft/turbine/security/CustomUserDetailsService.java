package eu.urzicroft.turbine.security;

import eu.urzicroft.turbine.model.UserAccount;
import eu.urzicroft.turbine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount userAccount = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Convert your database role (e.g. "PARK_T1") into a Spring Authority
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(userAccount.getRole());

        return new User(
                userAccount.getUsername(),
                userAccount.getPassword(), // This hash is checked automatically by Spring
                Collections.singletonList(authority)
        );
    }
}
