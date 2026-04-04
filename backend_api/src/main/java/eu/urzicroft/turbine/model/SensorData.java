package eu.urzicroft.turbine.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sensor_readings")
public class SensorData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "park_id")
    private String parkId;

    @Column(name = "turbine_id")
    private String turbineId;

    @Column(name = "sensor_type")
    private String sensorType;

    @Column(name = "timestamp")
    private LocalDateTime datetimeCurrentValue;

    @Column(name = "current_value")
    private Double currentValue;
}
