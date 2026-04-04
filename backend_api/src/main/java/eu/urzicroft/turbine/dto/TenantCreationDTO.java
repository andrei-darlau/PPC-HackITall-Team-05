package eu.urzicroft.turbine.dto;

import lombok.Data;

@Data
public class TenantCreationDTO {
    private String username;
    private String password;
    private String parkId;
}
