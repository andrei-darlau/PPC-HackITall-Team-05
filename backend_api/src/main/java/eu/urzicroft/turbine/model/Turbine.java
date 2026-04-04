package eu.urzicroft.turbine.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "turbine_metadata")
public class Turbine {
    @Id
    @Column(name = "turbine_id")
    private String id;

    @Column(name = "wtg_model_id")
    private String fkWtgModelId;

    @Column(name = "park_id")
    private String fkParkId;

    @Column(name = "lat_y")
    private double latY;

    @Column(name = "long_x")
    private double longX;
}
