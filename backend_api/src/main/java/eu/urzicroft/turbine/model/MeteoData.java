package eu.urzicroft.turbine.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meteo_readings")
public class MeteoData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "park_id")
    private String parkId;

    @Column(name = "turbine_id")
    private String turbineId;

    @Column(name = "wind_speed_mean_5min")
    private Double windSpeedMean5min;
}
