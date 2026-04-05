package eu.urzicroft.turbine.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FaultySensorDTO {
    private String sensorType;
    private long rejectionCount;
    private String latestRejectionReason;
    private LocalDateTime latestRejectedAt;
}
