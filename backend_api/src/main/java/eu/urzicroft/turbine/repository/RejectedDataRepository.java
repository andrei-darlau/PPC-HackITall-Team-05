package eu.urzicroft.turbine.repository;

import eu.urzicroft.turbine.model.RejectedData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface RejectedDataRepository extends JpaRepository<RejectedData, Long> {

    List<RejectedData> findByTurbineIdAndTimestampAfterOrderByTimestampDesc(
            String turbineId,
            LocalDateTime timestamp
    );

    List<RejectedData> findByParkIdAndTimestampAfterOrderByTimestampDesc(
            String parkId,
            LocalDateTime timestamp
    );
}
