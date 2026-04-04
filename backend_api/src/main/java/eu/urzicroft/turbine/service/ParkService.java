package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.dto.ParkLocationDTO;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParkService {

    private final TurbineRepository turbineRepository;

    @Cacheable("parkLocations")
    public List<ParkLocationDTO> getParkLocations() {
        return turbineRepository.getAverageParkLocations();
    }
}
