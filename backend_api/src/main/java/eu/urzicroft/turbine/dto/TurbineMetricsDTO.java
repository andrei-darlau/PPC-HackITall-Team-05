package eu.urzicroft.turbine.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TurbineMetricsDTO {
    private LocalDateTime timeBucket;
    private Double activePower;      // act_pwt
    private Double windSpeed;        // wd_spd
    private Double converterTemp;    // conv_t
    private Double gearboxTemp;      // gearbox_t
    private Double gen1Temp;         // gen1_t
    private Double gen2Temp;         // gen2_t
    private Double transformerTemp;  // transformer_t
    private Double ambientTemp;      // turbine_t
}
