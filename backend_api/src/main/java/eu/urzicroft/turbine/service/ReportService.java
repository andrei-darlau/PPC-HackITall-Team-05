package eu.urzicroft.turbine.service;

import eu.urzicroft.turbine.dto.TurbineAveragePower;
import eu.urzicroft.turbine.model.Turbine;
import eu.urzicroft.turbine.repository.SensorDataRepository;
import eu.urzicroft.turbine.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TurbineRepository turbineRepository;
    private final SensorDataRepository sensorDataRepository;

    public void generateDailyTsoCsvReport() {
        LocalDateTime startOfYesterday = LocalDate.now().minusDays(1).atStartOfDay();
        LocalDateTime endOfYesterday = startOfYesterday.plusDays(1).minusNanos(1);

        String fileName = "TSO_Report_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".csv";

        try (PrintWriter writer = new PrintWriter(new FileWriter(fileName))) {
            writer.println("Date,Park_ID,Turbine_ID,Average_Active_Power");

            List<Turbine> turbines = turbineRepository.findAll();

            Map<String, Double> powerMap = sensorDataRepository.getAveragePowerForAllTurbines(startOfYesterday, endOfYesterday)
                    .stream()
                    .collect(Collectors.toMap(
                            TurbineAveragePower::getTurbineId,
                            TurbineAveragePower::getAveragePower
                    ));

            for (Turbine t : turbines) {
                Double avgPowerYesterday = powerMap.get(t.getId());
                String powerValStr = avgPowerYesterday != null ? String.format(Locale.US, "%.2f", avgPowerYesterday) : "";
                writer.printf("%s,%s,%s,%s%n",
                        startOfYesterday.toLocalDate().toString(),
                        t.getParkId(),
                        t.getId(),
                        powerValStr
                );
            }
            log.info("Successfully generated TSO report: {}", fileName);
        } catch (IOException e) {
            log.error("Failed to generate TSO CSV report", e);
        }
    }
}
