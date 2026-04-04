package eu.urzicroft.turbine.repository;

import eu.urzicroft.turbine.dto.ParkLocationDTO;
import eu.urzicroft.turbine.model.Turbine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TurbineRepository extends JpaRepository<Turbine, String> {

    @Query("SELECT new eu.urzicroft.turbine.dto.ParkLocationDTO(t.parkId, AVG(t.latY), AVG(t.longX)) " +
           "FROM Turbine t GROUP BY t.parkId")
    List<ParkLocationDTO> getAverageParkLocations();

    @Query("SELECT DISTINCT t.parkId FROM Turbine t")
    List<String> getAllParkIds();

    List<Turbine> findByParkId(String parkId);

    boolean existsByParkId(String parkId);
}
