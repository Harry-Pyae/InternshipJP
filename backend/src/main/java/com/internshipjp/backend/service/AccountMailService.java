package com.internshipjp.backend.service;

import com.internshipjp.backend.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Emails about an account decision, separate from the OTP path.
 *
 * Nothing here is allowed to fail loudly. Sending is a side effect of a
 * decision that has already been made and saved - if the mail server is down,
 * the company is still approved, and throwing here would roll that back inside
 * the caller's transaction. Every failure is logged and swallowed on purpose.
 *
 * With MAIL_MODE=console the message is printed to the server log instead,
 * which is what development uses.
 */
@Service
public class AccountMailService {

    private static final Logger log = LoggerFactory.getLogger(AccountMailService.class);

    private final AppProperties appProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public AccountMailService(AppProperties appProperties,
                              ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.appProperties = appProperties;
        this.mailSenderProvider = mailSenderProvider;
    }

    /** Tells a recruiter their company was approved and the account is live. */
    public void sendCompanyApproved(String toEmail, String fullName, String companyName) {
        send(toEmail,
                "Your InternshipJP employer account is active",
                "Hello " + fullName + ",\n\n"
                        + "An administrator has reviewed " + companyName + " and approved it.\n\n"
                        + "Your employer account is now active. You can sign in and publish "
                        + "internships, and students will be able to see them and apply.\n\n"
                        + "Sign in: http://localhost:5173/login\n\n"
                        + "InternshipJP");
    }

    /** Tells a recruiter their company was not approved, and why. */
    public void sendCompanyRejected(String toEmail, String fullName, String companyName,
                                    String note) {
        send(toEmail,
                "About your InternshipJP employer registration",
                "Hello " + fullName + ",\n\n"
                        + "An administrator has reviewed " + companyName + " and could not "
                        + "approve it at this time.\n\n"
                        + (note == null || note.isBlank()
                                ? "No further detail was given.\n\n"
                                : "Reason given:\n" + note + "\n\n")
                        + "You can correct your company details and ask for another review.\n\n"
                        + "InternshipJP");
    }

    private void send(String toEmail, String subject, String body) {
        if ("console".equalsIgnoreCase(appProperties.getMail().getMode())) {
            log.info("=================== DEVELOPMENT EMAIL ===================");
            log.info(" To      : {}", toEmail);
            log.info(" Subject : {}", subject);
            log.info("{}", body);
            log.info(" MAIL_MODE=console - nothing was actually sent.");
            log.info("=========================================================");
            return;
        }

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("MAIL_MODE is smtp but no mail sender is configured, so no email was sent "
                    + "to {}. The decision itself was saved.", toEmail);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(appProperties.getMail().getFrom());
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        try {
            sender.send(message);
            log.info("Sent an account email to {}", toEmail);
        } catch (RuntimeException ex) {
            // Swallowed deliberately - see the class comment.
            log.error("Could not send the account email to {}", toEmail, ex);
        }
    }
}
