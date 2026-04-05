package eu.urzicroft.turbine.repository;

import eu.urzicroft.turbine.model.MeteoData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MeteoDataRepository extends JpaRepository<MeteoData, Long> {

    @Query("SELECT AVG(m.windSpeedMean5min) FROM MeteoData m " +
            "WHERE m.turbineId = :turbineId " +
            "AND m.timestamp >= :startTime")
    Double getAverageWindSpeedSince(@Param("turbineId") String turbineId,
                                    @Param("startTime") LocalDateTime startTime);


    @Query("SELECT AVG(m.windSpeedMean5min) FROM MeteoData m " +
            "WHERE m.parkId = :parkId " +
            "AND m.timestamp >= :startTime")
    Double getAverageWindSpeedForParkSince(@Param("parkId") String parkId,
                                           @Param("startTime") LocalDateTime startTime);

    @Query("SELECT m FROM MeteoData m " +
           "WHERE m.turbineId = :turbineId " +
           "AND m.timestamp >= :startTime " +
           "AND m.timestamp <= :endTime " +
           "ORDER BY m.timestamp ASC")
    List<MeteoData> getHistoryForTurbine(
            @Param("turbineId") String turbineId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
