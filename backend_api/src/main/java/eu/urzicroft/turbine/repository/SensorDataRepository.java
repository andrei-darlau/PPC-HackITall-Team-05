package eu.urzicroft.turbine.repository;

import eu.urzicroft.turbine.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    @Query("SELECT AVG(s.currentValue) FROM SensorData s " +
            "WHERE s.turbineId = :turbineId AND s.sensorType = :sensorType " +
            "AND s.datetimeCurrentValue >= :startTime")
    Double getAverageValueSince(@Param("turbineId") String turbineId,
                                @Param("sensorType") String sensorType,
                                @Param("startTime") LocalDateTime startTime);
}
