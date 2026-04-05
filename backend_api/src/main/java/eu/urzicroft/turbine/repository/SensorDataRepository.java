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
            "AND s.timestamp >= :startTime")
    Double getAverageValueSince(@Param("turbineId") String turbineId,
                                @Param("sensorType") String sensorType,
                                @Param("startTime") LocalDateTime startTime);

    @Query("SELECT s FROM SensorData s " +
            "WHERE s.turbineId = :turbineId " +
            "AND s.timestamp >= :startTime " +
            "AND s.timestamp <= :endTime " +
            "ORDER BY s.timestamp ASC")
    List<SensorData> getHistoryForTurbine(
            @Param("turbineId") String turbineId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = """
    SELECT\s
        CAST(to_timestamp(floor((extract('epoch' from timestamp) / 900 )) * 900) AS TIMESTAMP) AS "timeBucket",
        sensor_type AS "sensorType",
        AVG(current_value) AS "averageValue"
    FROM sensor_readings
    WHERE turbine_id = :turbineId
      AND timestamp >= :startTime
      AND timestamp <= :endTime
    GROUP BY 1, sensor_type
    ORDER BY 1 ASC
   \s""", nativeQuery = true)
    List<TurbineHistoryProjection> getAggregatedHistoryForTurbine(
            @Param("turbineId") String turbineId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = """
    WITH TurbineBucketAverages AS (
        SELECT\s
            date_bin('15 minutes', timestamp, TIMESTAMP '2000-01-01') AS "timeBucket",
            turbine_id,
            sensor_type,
            AVG(current_value) AS turbine_avg
        FROM sensor_readings
        WHERE park_id = :parkId
          AND timestamp >= :startTime
          AND timestamp <= :endTime
        GROUP BY 1, turbine_id, sensor_type
    )
    SELECT\s
        "timeBucket",
        sensor_type AS "sensorType",
        AVG(turbine_avg) AS "averageValue"
    FROM TurbineBucketAverages
    GROUP BY "timeBucket", sensor_type
    ORDER BY "timeBucket" ASC
  \s""", nativeQuery = true)
    List<TurbineHistoryProjection> getAggregatedHistoryForPark(
            @Param("parkId") String parkId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = """
    WITH TurbineAverages AS (
        SELECT\s
            CAST(to_timestamp(floor((extract('epoch' from timestamp) / 900 )) * 900) AS TIMESTAMP) AS "timeBucket",
            turbine_id,
            AVG(current_value) AS avg_power
        FROM sensor_readings
        WHERE sensor_type = 'act_pwt'
          AND timestamp >= :startTime
          AND timestamp <= :endTime
        GROUP BY 1, turbine_id
    )
    SELECT\s
        "timeBucket",
        'act_pwt' AS "sensorType",
        SUM(avg_power) AS "averageValue"\s
    FROM TurbineAverages
    GROUP BY "timeBucket"
    ORDER BY "timeBucket" ASC
  \s""", nativeQuery = true)
    List<TurbineHistoryProjection> getGlobalActivePowerHistory(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = """
    SELECT\s
        turbine_id AS "turbineId",\s
        AVG(current_value) AS "averagePower"\s
    FROM sensor_readings\s
    WHERE sensor_type = 'act_pwt'\s
      AND timestamp >= :startTime\s
      AND timestamp <= :endTime\s
    GROUP BY turbine_id
   \s""", nativeQuery = true)
    List<TurbineAveragePower> getAveragePowerForAllTurbines(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
