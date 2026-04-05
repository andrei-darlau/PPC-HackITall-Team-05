package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.dto.ParkLocationDTO;
import eu.urzicroft.turbine.model.Turbine;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkService {

    private final TurbineRepository turbineRepository;
    private static final double KM_PER_DEGREE = 111.32;

    @Cacheable("parkLocations")
    public List<ParkLocationDTO> getParkLocations() {
        return turbineRepository.getAverageParkLocations();
    }

    @Cacheable("parks")
    public List<String> getAllParkIds() {
        return turbineRepository.getAllParkIds();
    }

    public List<Turbine> getTurbinesByParkId(String parkId) {
        return turbineRepository.findByParkId(parkId);
    }

    @Cacheable(value = "parkRadius", key = "#parkId")
    public Double getParkRadius(String parkId) {
        List<Turbine> turbines = turbineRepository.findByParkId(parkId);
        if (turbines == null || turbines.isEmpty()) {
            return 0.0;
        }

        double sumLat = 0.0;
        double sumLon = 0.0;
        for (Turbine t : turbines) {
            sumLat += t.getLatY();
            sumLon += t.getLongX();
        }
        double centerLat = sumLat / turbines.size();
        double centerLon = sumLon / turbines.size();

        double maxRadiusKm = 0.0;
        for (Turbine t : turbines) {
            double distance = calculateFlatDistance(centerLat, centerLon, t.getLatY(), t.getLongX());
            if (distance > maxRadiusKm) {
                maxRadiusKm = distance;
            }
        }

        return maxRadiusKm;
    }

    private double calculateFlatDistance(double lat1, double lon1, double lat2, double lon2) {
        double avgLatRadians = Math.toRadians((lat1 + lat2) / 2.0);
        double deltaLatKm = (lat2 - lat1) * KM_PER_DEGREE;
        double deltaLonKm = (lon2 - lon1) * KM_PER_DEGREE * Math.cos(avgLatRadians);
        return Math.sqrt((deltaLatKm * deltaLatKm) + (deltaLonKm * deltaLonKm));
    }
}
