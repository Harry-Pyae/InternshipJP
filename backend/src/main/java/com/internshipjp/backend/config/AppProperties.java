package com.internshipjp.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Every "app.*" setting from application.yml, in one typed object.
 *
 * Inject this instead of using @Value in twenty places - it keeps the list of
 * configurable things discoverable, and it means a typo in a property name
 * shows up here rather than deep inside a service.
 */
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** Origin allowed by CORS, e.g. http://localhost:5173 */
    private String frontendOrigin = "http://localhost:5173";

    /** When false, the /api/test/** endpoints are not registered at all. */
    private boolean testEndpointsEnabled = true;

    private Storage storage = new Storage();
    private Security security = new Security();
    private Mail mail = new Mail();
    private Otp otp = new Otp();
    private Ai ai = new Ai();
    private BootstrapAdmin bootstrapAdmin = new BootstrapAdmin();
    private DemoData demoData = new DemoData();

    public static class Storage {
        /** Root folder for uploaded files. Relative paths resolve from backend/. */
        private String uploadRoot = "./uploads";
        private long maxFileSizeBytes = 5_242_880L;
        private List<String> allowedMimeTypes = List.of("application/pdf", "image/png", "image/jpeg");
        private List<String> allowedExtensions = List.of("pdf", "png", "jpg", "jpeg");

        public String getUploadRoot() {
            return uploadRoot;
        }

        public void setUploadRoot(String uploadRoot) {
            this.uploadRoot = uploadRoot;
        }

        public long getMaxFileSizeBytes() {
            return maxFileSizeBytes;
        }

        public void setMaxFileSizeBytes(long maxFileSizeBytes) {
            this.maxFileSizeBytes = maxFileSizeBytes;
        }

        public List<String> getAllowedMimeTypes() {
            return allowedMimeTypes;
        }

        public void setAllowedMimeTypes(List<String> allowedMimeTypes) {
            this.allowedMimeTypes = allowedMimeTypes;
        }

        public List<String> getAllowedExtensions() {
            return allowedExtensions;
        }

        public void setAllowedExtensions(List<String> allowedExtensions) {
            this.allowedExtensions = allowedExtensions;
        }
    }

    public static class Security {
        /** Base64 AES key used to encrypt TOTP secrets. Empty = TOTP disabled. */
        private String totpEncryptionKey = "";

        public String getTotpEncryptionKey() {
            return totpEncryptionKey;
        }

        public void setTotpEncryptionKey(String totpEncryptionKey) {
            this.totpEncryptionKey = totpEncryptionKey;
        }
    }

    public static class Mail {
        /** console = print the OTP to the log (dev only). smtp = really send it. */
        private String mode = "console";
        private String from = "no-reply@internshipjp.local";

        public String getMode() {
            return mode;
        }

        public void setMode(String mode) {
            this.mode = mode;
        }

        public String getFrom() {
            return from;
        }

        public void setFrom(String from) {
            this.from = from;
        }
    }

    public static class Otp {
        private int length = 6;
        private int expiryMinutes = 5;
        private int maxAttempts = 5;
        private int resendCooldownSeconds = 60;

        public int getLength() {
            return length;
        }

        public void setLength(int length) {
            this.length = length;
        }

        public int getExpiryMinutes() {
            return expiryMinutes;
        }

        public void setExpiryMinutes(int expiryMinutes) {
            this.expiryMinutes = expiryMinutes;
        }

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public int getResendCooldownSeconds() {
            return resendCooldownSeconds;
        }

        public void setResendCooldownSeconds(int resendCooldownSeconds) {
            this.resendCooldownSeconds = resendCooldownSeconds;
        }
    }

    public static class Ai {
        private String provider = "groq";
        private Groq groq = new Groq();

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public Groq getGroq() {
            return groq;
        }

        public void setGroq(Groq groq) {
            this.groq = groq;
        }
    }

    public static class Groq {
        /** Never log this value and never send it to the browser. */
        private String apiKey = "";
        private String model = "llama-3.3-70b-versatile";
        private String baseUrl = "https://api.groq.com/openai/v1";
        private int timeoutSeconds = 30;
        private int maxOutputTokens = 700;

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public int getTimeoutSeconds() {
            return timeoutSeconds;
        }

        public void setTimeoutSeconds(int timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }

        public int getMaxOutputTokens() {
            return maxOutputTokens;
        }

        public void setMaxOutputTokens(int maxOutputTokens) {
            this.maxOutputTokens = maxOutputTokens;
        }
    }

    public static class DemoData {
        /** Never true by default, and refused entirely under the prod profile. */
        private boolean enabled = false;
        /** Removes previously seeded demo rows before inserting fresh ones. */
        private boolean reset = false;
        /**
         * An existing student account to fill in with a realistic profile and
         * skills, so you can test the assistants signed in as yourself instead
         * of as a demo account. Left empty, nothing is touched.
         */
        private String attachStudent = "";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public boolean isReset() {
            return reset;
        }

        public void setReset(boolean reset) {
            this.reset = reset;
        }

        public String getAttachStudent() {
            return attachStudent;
        }

        public void setAttachStudent(String attachStudent) {
            this.attachStudent = attachStudent;
        }
    }

    public static class BootstrapAdmin {
        private boolean enabled = false;
        private String email = "";
        private String password = "";
        private String fullName = "Platform Administrator";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }
    }

    public String getFrontendOrigin() {
        return frontendOrigin;
    }

    public void setFrontendOrigin(String frontendOrigin) {
        this.frontendOrigin = frontendOrigin;
    }

    public boolean isTestEndpointsEnabled() {
        return testEndpointsEnabled;
    }

    public void setTestEndpointsEnabled(boolean testEndpointsEnabled) {
        this.testEndpointsEnabled = testEndpointsEnabled;
    }

    public Storage getStorage() {
        return storage;
    }

    public void setStorage(Storage storage) {
        this.storage = storage;
    }

    public Security getSecurity() {
        return security;
    }

    public void setSecurity(Security security) {
        this.security = security;
    }

    public Mail getMail() {
        return mail;
    }

    public void setMail(Mail mail) {
        this.mail = mail;
    }

    public Otp getOtp() {
        return otp;
    }

    public void setOtp(Otp otp) {
        this.otp = otp;
    }

    public Ai getAi() {
        return ai;
    }

    public void setAi(Ai ai) {
        this.ai = ai;
    }

    public DemoData getDemoData() {
        return demoData;
    }

    public void setDemoData(DemoData demoData) {
        this.demoData = demoData;
    }

    public BootstrapAdmin getBootstrapAdmin() {
        return bootstrapAdmin;
    }

    public void setBootstrapAdmin(BootstrapAdmin bootstrapAdmin) {
        this.bootstrapAdmin = bootstrapAdmin;
    }
}
