package com.internshipjp.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the InternshipJP backend.
 *
 * Run it with:   mvn spring-boot:run     (from the backend/ folder)
 * Or in Eclipse: right-click this file -> Run As -> Java Application
 *
 * There is no web.xml, no @WebServlet and no external Tomcat: Spring Boot
 * starts its own server on http://localhost:8080 .
 */
@SpringBootApplication
public class InternshipJpApplication {

    public static void main(String[] args) {
        SpringApplication.run(InternshipJpApplication.class, args);
    }
}
