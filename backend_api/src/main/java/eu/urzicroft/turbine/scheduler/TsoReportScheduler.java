package eu.urzicroft.turbine.scheduler;

import eu.urzicroft.turbine.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TsoReportScheduler {

    private final ReportService reportService;

    // Runs exactly at 09:00:00 every day
    @Scheduled(cron = "0 0 9 * * *")
    public void generateDailyTsoReport() {
        log.info("Triggering 9:00 AM TSO report generation...");
        reportService.generateDailyTsoCsvReport();
    }
}
