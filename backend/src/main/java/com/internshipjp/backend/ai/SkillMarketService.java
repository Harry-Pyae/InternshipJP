package com.internshipjp.backend.ai;

import com.internshipjp.backend.entity.InternshipSkill;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.repository.InternshipSkillRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * What the platform is asking for, and what it has.
 *
 * Two numbers per skill:
 *
 *   DEMAND  how many OPEN internships require it
 *   SUPPLY  how many students list it on their profile
 *
 * Those two numbers are the backbone of both assistants:
 *
 *   Student side  - "React is required by 7 of 12 open internships and you do
 *                    not have it" is a concrete, ranked reason to learn React,
 *                    rather than a language model's guess about what is popular.
 *
 *   Employer side - "you require Kubernetes, and 0 of 14 students on the
 *                    platform list it" tells an employer their own requirement
 *                    is why nobody is applying.
 *
 * Both are counted here in Java rather than in SQL. At the size of a
 * university project this is a few hundred rows, and one readable method beats
 * two clever GROUP BY queries that nobody on the team can maintain.
 *
 * Skill names are compared in lower case, because a student writing "react"
 * and an employer writing "React" mean the same thing. The nicest-looking
 * original spelling is kept for display.
 *
 * Owner: Member 1.
 */
@Service
public class SkillMarketService {

    private final InternshipSkillRepository internshipSkillRepository;
    private final StudentSkillRepository studentSkillRepository;

    public SkillMarketService(InternshipSkillRepository internshipSkillRepository,
                              StudentSkillRepository studentSkillRepository) {
        this.internshipSkillRepository = internshipSkillRepository;
        this.studentSkillRepository = studentSkillRepository;
    }

    /** A snapshot of demand and supply, taken once so both sides agree. */
    @Transactional(readOnly = true)
    public SkillMarket snapshot() {
        List<InternshipSkill> required =
                internshipSkillRepository.findAllByInternshipStatus(InternshipStatus.OPEN);
        List<StudentSkill> held = studentSkillRepository.findAll();

        Map<String, Integer> demand = new HashMap<>();
        Map<String, String> displayNames = new HashMap<>();
        Map<String, Set<Long>> internshipsPerSkill = new HashMap<>();
        for (InternshipSkill skill : required) {
            String key = normalise(skill.getName());
            displayNames.putIfAbsent(key, skill.getName());
            internshipsPerSkill
                    .computeIfAbsent(key, unused -> new HashSet<>())
                    .add(skill.getInternship().getId());
        }
        for (Map.Entry<String, Set<Long>> entry : internshipsPerSkill.entrySet()) {
            demand.put(entry.getKey(), entry.getValue().size());
        }

        Map<String, Set<Long>> studentsPerSkill = new HashMap<>();
        for (StudentSkill skill : held) {
            String key = normalise(skill.getName());
            displayNames.putIfAbsent(key, skill.getName());
            studentsPerSkill
                    .computeIfAbsent(key, unused -> new HashSet<>())
                    .add(skill.getStudentProfile().getId());
        }
        Map<String, Integer> supply = new LinkedHashMap<>();
        for (Map.Entry<String, Set<Long>> entry : studentsPerSkill.entrySet()) {
            supply.put(entry.getKey(), entry.getValue().size());
        }

        Set<Long> distinctOpenInternships = new HashSet<>();
        for (InternshipSkill skill : required) {
            distinctOpenInternships.add(skill.getInternship().getId());
        }
        Set<Long> distinctStudentsWithSkills = new HashSet<>();
        for (StudentSkill skill : held) {
            distinctStudentsWithSkills.add(skill.getStudentProfile().getId());
        }

        return new SkillMarket(demand, supply, displayNames,
                distinctOpenInternships.size(), distinctStudentsWithSkills.size());
    }

    public static String normalise(String name) {
        return name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
    }

    /** Immutable snapshot, so a report cannot see two different states. */
    public static class SkillMarket {

        private final Map<String, Integer> demand;
        private final Map<String, Integer> supply;
        private final Map<String, String> displayNames;
        private final int openInternshipsWithSkills;
        private final int studentsWithSkills;

        SkillMarket(Map<String, Integer> demand, Map<String, Integer> supply,
                    Map<String, String> displayNames,
                    int openInternshipsWithSkills, int studentsWithSkills) {
            this.demand = demand;
            this.supply = supply;
            this.displayNames = displayNames;
            this.openInternshipsWithSkills = openInternshipsWithSkills;
            this.studentsWithSkills = studentsWithSkills;
        }

        /** How many OPEN internships require this skill. */
        public int demandFor(String skillKey) {
            return demand.getOrDefault(skillKey, 0);
        }

        /** How many students list this skill. */
        public int supplyOf(String skillKey) {
            return supply.getOrDefault(skillKey, 0);
        }

        public String displayName(String skillKey) {
            return displayNames.getOrDefault(skillKey, skillKey);
        }

        public Map<String, Integer> allDemand() {
            return demand;
        }

        public int getOpenInternshipsWithSkills() {
            return openInternshipsWithSkills;
        }

        public int getStudentsWithSkills() {
            return studentsWithSkills;
        }

        /** Demand as a share of open internships, for readable sentences. */
        public int demandSharePercent(String skillKey) {
            if (openInternshipsWithSkills == 0) {
                return 0;
            }
            return (int) Math.round((demandFor(skillKey) * 100.0) / openInternshipsWithSkills);
        }
    }
}
