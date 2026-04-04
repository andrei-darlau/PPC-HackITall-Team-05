package eu.urzicroft.turbine.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class KpiResponseDTO {
    private String turbineId;
    private String parkId;
    private LocalDateTime timestamp;
    private Double activePower;
    private Double windSpeed;
    private Double ambientTemp;
}
