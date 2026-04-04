package eu.urzicroft.turbine.service;

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

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TurbineRepository turbineRepository;
    private final SensorDataRepository sensorDataRepository;

    public void generateDailyTsoCsvReport() {
        // Define "Yesterday" from 00:00:00 to 23:59:59
        LocalDateTime startOfYesterday = LocalDate.now().minusDays(1).atStartOfDay();
        LocalDateTime endOfYesterday = startOfYesterday.plusDays(1).minusNanos(1);

        String fileName = "TSO_Report_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".csv";

        try (PrintWriter writer = new PrintWriter(new FileWriter(fileName))) {
            // write CSV Header
            writer.println("Date,Park_ID,Turbine_ID,Average_Active_Power");

            List<Turbine> turbines = turbineRepository.findAll();

            for (Turbine t : turbines) {
                // fetch the average power for this specific turbine for the last 24 hours
                Double avgPowerYesterday = sensorDataRepository.getAverageValueSince(
                        t.getId(),
                        "act_pwt",
                        startOfYesterday
                );

                // handle potential nulls if a turbine was offline
                double powerVal = avgPowerYesterday != null ? avgPowerYesterday : 0.0;

                // write the row
                writer.printf("%s,%s,%s,%.2f%n",
                        startOfYesterday.toLocalDate().toString(),
                        t.getFkParkId(),
                        t.getId(),
                        powerVal
                );
            }
            log.info("Successfully generated TSO report: {}", fileName);

        } catch (IOException e) {
            log.error("Failed to generate TSO CSV report", e);
        }
    }
}
