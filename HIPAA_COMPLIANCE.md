# HIPAA Compliance & Cybersecurity Report

This document outlines the current security state of ClinVoice AI and specifies the technical and administrative controls required to certify the application for HIPAA compliance in a production environment.

## 1. Executive Summary

ClinVoice AI handles Protected Health Information (PHI) in the form of patient demographics, recorded clinical audio, transcribed consultations, and generated SOAP notes. 
To achieve HIPAA compliance under the **HIPAA Security Rule (45 CFR Part 160 and Part 164, Subparts A and C)**, the application must enforce strict administrative, physical, and technical safeguards.

---

## 2. Technical Safeguards Audit & Status

### A. Access Control (§ 164.312(a))
*   **Password Hashing:** [Compliant] Passwords are securely hashed using `bcrypt` (via `passlib`) before storage in the database.
*   **Unique User Identification:** [Compliant] All doctors and administrators sign up with unique email addresses and credentials.
*   **Session Management:** [Compliant] Secure JSON Web Tokens (JWT) are used for authentication with a configured 30-minute expiration interval.
*   **Auto-Logoff (Inactivity Timeout):** [Gap] The frontend must implement an automatic logout of the user session after 15 minutes of inactivity.

### B. Audit Controls (§ 164.312(b))
*   **Access Logging:** [Gap] HIPAA requires tracking every read, write, update, and delete action on PHI data.
*   **Recommendation:** Implement an immutable audit logging table in Postgres or external cloud logging service to track:
    *   Timestamp
    *   User ID (Doctor ID)
    *   Action Performed (e.g., READ Case Sheet, UPDATE SOAP Note)
    *   Patient ID
    *   IP Address & Client User Agent

### C. Integrity (§ 164.312(c))
*   **Data Integrity:** [Compliant] The use of relational integrity constraints (foreign keys, non-nullable fields) and NRCES-compliant FHIR bundles ensures structure and guards against accidental deletion or modification.

### D. Encryption at Rest (§ 164.312(a)(2)(iv))
*   **Audio Uploads:** [Gap] Recorded audio files uploaded to `/uploads/` are currently stored in plaintext on the local storage volume.
*   **Database Records:** [Gap] Patient tables and consultation tables containing diagnosis data must be encrypted.
*   **Recommendation:**
    1.  Encrypt storage volumes (e.g., AWS EBS encrypted with KMS keys) where files and databases are hosted.
    2.  Implement column-level database encryption for direct PHI fields, or enable database-level Transparent Data Encryption (TDE).

### E. Transmission Security / Encryption in Transit (§ 164.312(e))
*   **Network Protocols:** [Gap] While local testing uses HTTP/WS, production environments must only allow HTTPS/WSS connections using **TLS 1.2 or TLS 1.3**.
*   **Recommendation:** Enforce SSL redirection at the proxy/load-balancer level (e.g., Nginx, Cloudflare) and block any unsecured port 80/ws traffic.

---

## 3. Administrative Safeguards & Partnerships

### A. Business Associate Agreement (BAA)
Since ClinVoice AI leverages third-party services, a BAA must be signed with each entity before handling real patient data:
1.  **AI Provider (OpenAI):** Ensure a BAA is executed with OpenAI under an Enterprise or Team plan. Enable **Zero Data Retention (ZDR)** so patient data is never cached or used for model training.
2.  **Hosting Provider:** Host on a HIPAA-compliant cloud environment (e.g., AWS, Google Cloud, Supabase Enterprise) and obtain their BAA.

---

## 4. Production Readiness Checklist

- [ ] Sign Business Associate Agreement (BAA) with OpenAI.
- [ ] Sign BAA with Cloud Hosting Provider.
- [ ] Enforce HTTPS (TLS 1.3) and WSS across all API endpoints.
- [ ] Enable Storage Volume Encryption and DB encryption at rest.
- [ ] Implement an audit logger to track read/write access to patient rows.
- [ ] Add inactivity timeout (auto-logout) to the React frontend dashboard.
