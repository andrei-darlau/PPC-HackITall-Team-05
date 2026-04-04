package eu.urzicroft.turbine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ParkLocationDTO {
    private String parkId;
    private Double averageLat;
    private Double averageLong;
}
