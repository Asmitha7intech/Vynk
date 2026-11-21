# VYNK — Community Guidelines & Code of Conduct

> [!IMPORTANT]
> **LEGAL NOTICE: REQUIRES FORMAL LEGAL COUNSEL REVIEW BEFORE PRODUCTION DEPLOYMENT.**
> This standard establishes community expectations, moderation rules, and anti-harassment safeguards for students and academic collaborators across all participating universities.

---

**Effective Date:** November 21, 2026  
**Platform:** VYNK Student Social & Collaboration Ecosystem  
**Target Audience:** Students, Faculty, Researchers, Student Organizations  

---

## 1. Our Mission & Values

VYNK is built to empower higher-education students to discover talented peers across institutions, form collaborative hackathon crews, embark on real project voyages, showcase verifiable achievements, and grow together.

We are dedicated to providing a safe, inclusive, welcoming, and harassment-free experience for everyone, regardless of academic background, gender identity, sexual orientation, disability, physical appearance, race, ethnicity, or socioeconomic status.

---

## 2. Expected Standards of Conduct

Every student on VYNK agrees to uphold the following standards:
1. **Be Constructive & Respectful:** Foster positive, helpful interactions in project discussions, voyage code reviews, and comment threads.
2. **Encourage Cross-Campus Collaboration:** Welcome students from different departments, colleges, and experience levels into your Voyages and Hackathon Crews.
3. **Credit Contributors Accurately:** Acknowledge teammates, co-authors, and open-source packages transparently in your project voyages and portfolios.
4. **Maintain Academic Integrity:** Share knowledge, learning notes, and project architectures ethically without sharing illicit exam answers or plagiarized coursework.

---

## 3. Prohibited Behaviors (Zero Tolerance)

The following behaviors are strictly prohibited on VYNK and warrant immediate disciplinary action:
- **Harassment & Bullying:** Targeted abuse, insults, discriminatory slurs, sexual harassment, or persistent unwanted direct messaging.
- **Doxing & Privacy Violations:** Sharing personal phone numbers, physical addresses, private academic records, or unauthorized photographs of peers.
- **Academic Dishonesty & Fraud:** Distributing live test answers, selling completed assignments, or submitting synthetic/plagiarized hackathon projects.
- **Malicious Hacking & Exploits:** Attempting unauthorized access to other students' accounts, tampering with API endpoints, or exploiting IDOR vulnerabilities.
- **Spam, Commercial Solicitations & Bots:** Automated scraping, spamming comment sections with commercial links, or deploying fake/bot accounts.

---

## 4. Safety Controls & Reporting Mechanisms

VYNK provides self-service safety tools directly within the student interface:
1. **User Blocking:** You can block any user at any time (`POST /api/v1/blocks/:userId`). Blocked users cannot send you direct messages, view your private crew discussions, or connect with you.
2. **Moderation Reports:** Any student can flag objectionable posts, offensive comments, or abusive messages (`POST /api/v1/reports`). Reports enter the administrative moderation queue with tamper-evident audit trails.
3. **Session Management:** Students can inspect active login sessions and instantly revoke suspicious sessions from any device (`POST /api/v1/auth/sessions/revoke-all`).

---

## 5. Moderation & Enforcement Policy

Reported violations are investigated by authorized campus moderators and platform administrators:
- **Level 1 (Warning & Content Removal):** First-time minor infractions result in immediate content removal and a formal warning.
- **Level 2 (Temporary Suspension):** Repeated or serious infractions result in a 7-day to 30-day platform suspension.
- **Level 3 (Permanent Ban & Campus Escalation):** Egregious violations (hate speech, severe harassment, malicious security compromise) result in permanent account termination and referral to the student's institutional ethics committee.

---

## 6. Appeals & Contact

If you believe a moderation action was taken in error, you may file an appeal to the Safety Review Team:
**Email:** `safety@vynk.app`  
**Super Admin Escalation:** `asmitha7intech@gmail.com`
