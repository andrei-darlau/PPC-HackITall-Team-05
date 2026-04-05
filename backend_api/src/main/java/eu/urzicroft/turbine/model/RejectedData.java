package eu.urzicroft.turbine.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Table(schema = "rejected_readings")
public class RejectedData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tag_name")
    private String tagName;

    @Column(name = "etl_ts")
    private LocalDateTime etlTs;

    @Column(name = "park_id")
    private String parkId;

    @Column(name = "turbine_id")
    private String turbineId;

    @Column(name = "sensor_type")
    private String sensorType;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "current_value")
    private Double currentValue;

    @Column(name = "rejection_reason")
    private String rejectionReason;
}
