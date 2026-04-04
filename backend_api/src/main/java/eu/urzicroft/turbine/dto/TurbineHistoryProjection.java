package eu.urzicroft.turbine.dto;

import java.time.LocalDateTime;

public interface TurbineHistoryProjection {
    LocalDateTime getTimeBucket();
    String getSensorType();
    Double getAverageValue();
}
