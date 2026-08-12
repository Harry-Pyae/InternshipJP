package com.internshipjp.backend.service;

import com.internshipjp.backend.config.AppProperties;
import com.internshipjp.backend.exception.ProviderUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Delivers one-time codes by email, behind a switch.
 *
 *   MAIL_MODE=console  the code is printed in the backend console. This is for
 *                      development only, so nobody has to configure SMTP just
 *                      to test the 2FA flow.
 *   MAIL_MODE=smtp     a real message is sent through Spring Mail.
 *
 * SAFETY RULE
 *   A one-time code must never be written to a log in production. If the
 *   application is running with the "prod" profile active, console mode is
 *   refused outright rather than silently leaking codes into the log file.
 */
@Service
public class OtpMailService {

    private static final Logger log = LoggerFactory.getLogger(OtpMailService.class);

    private final AppProperties appProperties;
    private final Environment environment;
    /** ObjectProvider: a JavaMailSender only exists when SMTP is configured. */
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public OtpMailService(AppProperties appProperties,
                          Environment environment,
                          ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.appProperties = appProperties;
        this.environment = environment;
        this.mailSenderProvider = mailSenderProvider;
    }

    public void sendOtp(String toEmail, String code, String purposeLabel) {
        String mode = appProperties.getMail().getMode();

        if ("console".equalsIgnoreCase(mode)) {
            if (environment.acceptsProfiles(Profiles.of("prod"))) {
                throw new ProviderUnavailableException(
                        "Email delivery is not configured. Set MAIL_MODE=smtp before going live.");
            }
            log.info("=================== DEVELOPMENT EMAIL ===================");
            log.info(" To      : {}", toEmail);
            log.info(" Purpose : {}", purposeLabel);
            log.info(" Code    : {}  (valid for {} minutes)", code,
                    appProperties.getOtp().getExpiryMinutes());
            log.info(" MAIL_MODE=console - this must never be used in production.");
            log.info("=========================================================");
            return;
        }

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            throw new ProviderUnavailableException(
                    "MAIL_MODE is smtp but no mail server is configured. "
                            + "Set spring.mail.host in application-local.properties.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(appProperties.getMail().getFrom());
        message.setTo(toEmail);
        message.setSubject("Your InternshipJP verification code");
        message.setText("Your verification code is " + code + ".\n\n"
                + "It expires in " + appProperties.getOtp().getExpiryMinutes() + " minutes.\n"
                + "If you did not request this code, you can ignore this email.");

        try {
            sender.send(message);
            // The code itself is deliberately absent from this log line.
            log.info("Sent an OTP email to {}", toEmail);
        } catch (Exception ex) {
            log.error("Could not send the OTP email to {}", toEmail, ex);
            throw new ProviderUnavailableException(
                    "The verification email could not be sent. Please try again.");
        }
    }
}
