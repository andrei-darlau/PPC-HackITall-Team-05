package eu.urzicroft.turbine.repository;

import eu.urzicroft.turbine.dto.TurbineAveragePower;
import eu.urzicroft.turbine.dto.TurbineHistoryProjection;
import eu.urzicroft.turbine.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    @Query("SELECT AVG(s.currentValue) FROM SensorData s " +
            "WHERE s.turbineId = :turbineId AND s.sensorType = :sensorType " +
            "AND s.datetimeCurrentValue >= :startTime")
    Double getAverageValueSince(@Param("turbineId") String turbineId,
                                @Param("sensorType") String sensorType,
                                @Param("startTime") LocalDateTime startTime);

    @Query("SELECT s FROM SensorData s " +
            "WHERE s.turbineId = :turbineId " +
            "AND s.datetimeCurrentValue >= :startTime " +
            "AND s.datetimeCurrentValue <= :endTime " +
            "ORDER BY s.datetimeCurrentValue ASC")
    List<SensorData> getHistoryForTurbine(
            @Param("turbineId") String turbineId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = """
    SELECT\s
        to_timestamp(floor((extract('epoch' from timestamp) / 900 )) * 900) AS timeBucket,
        sensor_type AS sensorType,
        AVG(current_value) AS averageValue
    FROM sensor_readings
    WHERE turbine_id = :turbineId
      AND timestamp >= :startTime
      AND timestamp <= :endTime
    GROUP BY timeBucket, sensor_type
    ORDER BY timeBucket ASC
   \s""", nativeQuery = true)
    List<TurbineHistoryProjection> getAggregatedHistoryForTurbine(
            @Param("turbineId") String turbineId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = """
    SELECT\s
        to_timestamp(floor((extract('epoch' from timestamp) / 900 )) * 900) AS timeBucket,
        'act_pwt' AS sensorType,
        SUM(current_value) AS averageValue\s
    FROM sensor_readings
    WHERE sensor_type = 'act_pwt'
      AND timestamp >= :startTime
      AND timestamp <= :endTime
    GROUP BY timeBucket
    ORDER BY timeBucket ASC
  \s""", nativeQuery = true)
    List<TurbineHistoryProjection> getGlobalActivePowerHistory(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = """
    SELECT 
        turbine_id AS turbineId, 
        AVG(current_value) AS averagePower 
    FROM sensor_readings 
    WHERE sensor_type = 'act_pwt' 
      AND timestamp >= :startTime 
      AND timestamp <= :endTime 
    GROUP BY turbine_id
    """, nativeQuery = true)
    List<TurbineAveragePower> getAveragePowerForAllTurbines(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
