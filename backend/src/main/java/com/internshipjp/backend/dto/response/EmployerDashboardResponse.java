package com.internshipjp.backend.dto.response;

/**
 * Statistics shown on the employer dashboard.
 *
 * All values are calculated from the employer's own company data.
 */
public class EmployerDashboardResponse {

    private long openVacancies;

    private long totalApplicants;

    private long acceptedApplicants;

    private double conversionRate;

    public long getOpenVacancies() {
        return openVacancies;
    }

    public void setOpenVacancies(long openVacancies) {
        this.openVacancies = openVacancies;
    }

    public long getTotalApplicants() {
        return totalApplicants;
    }

    public void setTotalApplicants(long totalApplicants) {
        this.totalApplicants = totalApplicants;
    }

    public long getAcceptedApplicants() {
        return acceptedApplicants;
    }

    public void setAcceptedApplicants(long acceptedApplicants) {
        this.acceptedApplicants = acceptedApplicants;
    }

    public double getConversionRate() {
        return conversionRate;
    }

    public void setConversionRate(double conversionRate) {
        this.conversionRate = conversionRate;
    }
}