# VYNK — Privacy Policy

> [!IMPORTANT]
> **LEGAL NOTICE: REQUIRES FORMAL LEGAL COUNSEL REVIEW BEFORE PRODUCTION DEPLOYMENT.**
> This document is an engineering compliance template drafted to comply with the Digital Personal Data Protection Act, 2023 (India — DPDP Act), FERPA best practices for academic institutions, and global data privacy standards. It must be reviewed and countersigned by qualified legal counsel prior to commercial launch.

---

**Last Updated:** November 21, 2026  
**Platform:** VYNK Student Social & Collaboration Ecosystem  
**Operator:** VYNK Campus Technologies  

---

## 1. Overview and Scope

VYNK ("we", "us", or "our") operates a student-focused social, academic, and project collaboration platform. This Privacy Policy describes how we collect, store, process, and protect your digital personal data when you access or use the VYNK web application, APIs, and associated mobile services.

We process student data solely to enable verified academic discovery, peer collaboration, hackathon crew formation, and skill development.

---

## 2. Personal Data We Collect

We adhere strictly to the principle of **Data Minimization** under Section 6 of the DPDP Act 2023. We only collect data necessary to provide platform features:

### A. Information You Provide
1. **Student Identity Data:** Name, institutional email address (e.g., `@citchennai.net`), campus enrollment year, degree department, and college name.
2. **Profile Credentials:** Argon2id-hashed passwords. Plaintext passwords are never recorded, logged, or stored.
3. **Professional & Academic Portfolio:** Skills, interests, project voyage descriptions, GitHub links, and profile photos.
4. **Communications:** Direct messages, crew discussions, comments, and community forum contributions.

### B. Automatically Collected Technical Data
1. **Device & Network Telemetry:** IP address, user-agent string, device type, and login session identifiers.
2. **Security & Session Cookies:** Secure, HttpOnly, SameSite cookies used strictly for session rotation and authentication token security.
3. **Audit Trail:** Moderation events, permission escalations, and security-relevant changes logged into an immutable `AuditLog` table.

---

## 3. Lawful Basis and Purpose of Processing (DPDP Act Section 4)

We process your digital personal data under the following lawful grounds:
- **Explicit Consent:** Obtained at user signup for platform services.
- **Contractual Necessity:** Delivering messaging, project formation, and student directory features requested by you.
- **Academic Verification:** Validating institutional affiliation to maintain a safe campus environment.

---

## 4. Security & Cryptographic Safeguards

VYNK implements enterprise-grade technical safeguards:
- **Argon2id Password Hashing:** Memory-hard cryptographic hashing resistant to GPU brute-force attacks.
- **Rotating Refresh Tokens:** Single-use session tokens with immediate revocation of all sessions in a session family upon detected token replay.
- **IDOR Protection:** Strict server-side ownership verification preventing unauthorized modification or deletion of posts, messages, or crew tasks.
- **Content Validation:** Magic byte inspection on all uploaded files to eliminate malicious payloads.
- **Transport Security:** Strict TLS 1.3 encryption in transit for all web and WebSocket communication.

---

## 5. Rights of the Data Principal (Student Rights)

Under Chapter III of the DPDP Act 2023, you possess the following rights:
1. **Right to Access Information:** View all personal data, active login sessions, and profile attributes associated with your account (`GET /api/v1/auth/me` and `/sessions`).
2. **Right to Correction & Updating:** Correct inaccuracies in your academic profile at any time.
3. **Right to Erasure (Account Deletion):** Request complete erasure of your personal data and account records.
4. **Right to Grievance Redressal:** Submit moderation or safety complaints through the built-in safety reporting mechanism (`POST /api/v1/reports`).

---

## 6. Grievance Officer & Contact Information

For privacy inquiries, data erasure requests, or grievances under the DPDP Act 2023, contact:

**Data Protection & Grievance Officer:**  
Email: `privacy@vynk.app`  
Escalation / Super Admin: `asmitha7intech@gmail.com`  
Address: Chennai Institute of Technology Campus, Kundrathur, Chennai, Tamil Nadu 600069
