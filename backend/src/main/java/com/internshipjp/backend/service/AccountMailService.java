package com.internshipjp.backend.service;

import com.internshipjp.backend.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

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

    /** The code someone needs to set a new password. */
    public void sendPasswordReset(String toEmail, String fullName, String code, int minutes) {
        send(toEmail,
                "Your InternshipJP password reset code",
                "Hello " + fullName + ",\n\n"
                        + "Someone asked to reset the password for this account. Your code is:\n\n"
                        + "    " + code + "\n\n"
                        + "It expires in " + minutes + " minutes and can be used once.\n\n"
                        + "If this was not you, nothing has changed and you can ignore this "
                        + "email. Your password stays as it is until the code is used.\n\n"
                        + "InternshipJP");
    }

    /**
     * Prints the email as one framed block.
     *
     * Six separate log calls meant six timestamped, thread-tagged lines with
     * the message text wrapped between them, which is unreadable when the
     * whole point is to copy a six-digit code out of it. One call keeps the
     * block together, and a code is pulled out and shown on its own line.
     */
    private void logToConsole(String toEmail, String subject, String body) {
        String rule = "-".repeat(64);
        StringBuilder out = new StringBuilder(System.lineSeparator());
        out.append(rule).append(System.lineSeparator());
        out.append("  EMAIL (not sent - MAIL_MODE=console)").append(System.lineSeparator());
        out.append(rule).append(System.lineSeparator());
        out.append("  To       ").append(toEmail).append(System.lineSeparator());
        out.append("  Subject  ").append(subject).append(System.lineSeparator());

        // A six-digit code is the only thing anyone reads out of this, so it
        // gets its own line rather than being hunted for inside a paragraph.
        Matcher code = Pattern.compile("\\b(\\d{6})\\b").matcher(body);
        if (code.find()) {
            out.append(rule).append(System.lineSeparator());
            out.append("  CODE     ").append(code.group(1)).append(System.lineSeparator());
        }

        out.append(rule).append(System.lineSeparator());
        for (String line : body.split("\\R")) {
            out.append("  ").append(line).append(System.lineSeparator());
        }
        out.append(rule);

        log.info("{}", out);
    }

    private void send(String toEmail, String subject, String body) {
        if ("console".equalsIgnoreCase(appProperties.getMail().getMode())) {
            logToConsole(toEmail, subject, body);
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

    /**
     * An invitation to become an administrator.
     *
     * The code is the whole credential until it is used, so the message says
     * plainly what it is for and what to do if it was unexpected. Nobody
     * receives a password in an email, because one administrator setting
     * another's password would mean two people knew it.
     */
    public void sendAdminInvite(String toEmail, String fullName, String code, int hours) {
        send(toEmail,
                "You have been invited to administer InternshipJP",
                "Hello " + fullName + ",\n\n"
                        + "An administrator has invited you to help run InternshipJP. "
                        + "Your invitation code is:\n\n"
                        + "    " + code + "\n\n"
                        + "Open http://localhost:5173/auth/accept-invite , enter this "
                        + "address and the code, and choose your own password.\n\n"
                        + "The code expires in " + hours + " hours and can be used once. "
                        + "Until you use it the account cannot be signed into at all.\n\n"
                        + "If you were not expecting this, tell the person who administers "
                        + "the platform. Ignoring the email leaves the account unusable.\n\n"
                        + "InternshipJP");
    }
}
