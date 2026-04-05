package eu.urzicroft.turbine.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Paths;

@Slf4j
@Component
public class DataPipelineScheduler {

    @Scheduled(cron = "0 */5 * * * *")
    public void triggerDataPipeline() {
        log.info("Triggering Python data pipeline using venv...");

        try {
            // 1. Path to the python script
            String scriptPath = Paths.get("..", "data_pipeline", "main.py")
                    .toAbsolutePath()
                    .normalize()
                    .toString();

            // 2. Path to the Python executable INSIDE the virtual environment
            // IMPORTANT: Change "venv" if you named your virtual environment folder something else.

            // For Linux / macOS:
//            String pythonExecutable = Paths.get("..", "data_pipeline", "venv", "bin", "python")
//                    .toAbsolutePath()
//                    .normalize()
//                    .toString();

            // If you are running this on Windows, uncomment this line instead:
             String pythonExecutable = Paths.get("..", "data_pipeline", ".venv", "Scripts", "python.exe")
                     .toAbsolutePath()
                     .normalize()
                     .toString();

            // 3. Build the process using the venv's python executable
            ProcessBuilder processBuilder = new ProcessBuilder(pythonExecutable, scriptPath);
            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("[Python Pipeline] {}", line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("Data pipeline completed successfully.");
            } else {
                log.error("Data pipeline failed with exit code: {}", exitCode);
            }

        } catch (Exception e) {
            log.error("Failed to execute data pipeline script", e);
        }
    }
}
