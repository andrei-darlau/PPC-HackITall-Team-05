package eu.urzicroft.turbine.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TurbineGraphPointDTO {
    private LocalDateTime timeBucket;
    private Double activePower;
    private Double windSpeed;
    private Double ambientTemp;
}
