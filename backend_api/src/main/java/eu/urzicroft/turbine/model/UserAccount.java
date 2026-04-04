package eu.urzicroft.turbine.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class UserAccount {
    @Id
    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password; // bcrypt hash

    @Column(nullable = false)
    private String role; // e.g.: "ROLE_ADMIN", "PARK_1", "PARK_2"
}
