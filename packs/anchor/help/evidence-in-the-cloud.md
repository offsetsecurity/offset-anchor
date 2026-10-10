# Collecting evidence from the cloud

Most of the proof an assessor wants already exists in your cloud console. The
work is exporting it, dating it, and attaching it to the right control.

Export as PDF or CSV, name it so the date is obvious, and record the collected
date in **Evidence**. Collect it again every quarter; anything older than 90
days is flagged here.

If the cloud provider operates a control for you, set its origination to
**Inherited** or **Hybrid**, and attach the provider's own report as the proof.

## Microsoft 365 and Entra ID

| Proof | Where | Controls |
|---|---|---|
| Multi-factor authentication is enforced | Entra ID → Conditional Access → policy, exported | IA-2(1), IA-2(2) |
| Who has admin roles | Entra ID → Roles and administrators | AC-2, AC-6 |
| Access review results | Entra ID Governance → Access reviews | AC-6(7) |
| Leavers disabled | Entra ID → Users, filtered by sign-in status | AC-2(3), PS-4 |
| Audit log kept | Purview → Audit search, exported | AU-2, AU-6, AU-11 |
| Data loss prevention rules | Purview → Data loss prevention | AC-4 |
| Device compliance | Intune → Devices → Compliance | CM-6, CM-8 |

## AWS

| Proof | Where | Controls |
|---|---|---|
| Root account has MFA and is unused | IAM → Credential report | IA-2(1), AC-2 |
| Who can do what | IAM → Access Analyzer findings, policy export | AC-3, AC-6 |
| Logging is on, protected and kept | CloudTrail → Trails, S3 lifecycle rules | AU-2, AU-9, AU-11 |
| Encryption at rest | KMS key list, S3 bucket settings | SC-28, SC-12 |
| Backups run and restore | AWS Backup → Jobs, and a restore test record | CP-9, CP-4 |
| Patch level | Systems Manager → Patch compliance | SI-2, RA-5 |
| Network exposure | Security Groups, Config rules | SC-7, CM-7 |

## Google Workspace and Google Cloud

| Proof | Where | Controls |
|---|---|---|
| Two-step verification enforced | Admin console → Security → Authentication | IA-2(1), IA-2(2) |
| Admin activity | Admin console → Reporting → Audit | AU-2, AU-6 |
| Sharing rules | Admin console → Apps → Drive → Sharing settings | AC-3, AC-21 |
| Who has project access | IAM & Admin → IAM, exported | AC-2, AC-6 |
| Logging and retention | Cloud Logging → Log buckets | AU-11 |

## What makes an export good evidence

**It shows the date it was taken.** A screenshot with no date proves nothing.

**It shows the whole setting, not the part that flatters you.** An assessor who
finds the crop will ask what else was cropped.

**It says who took it.** The evidence record does that for you.

**It matches what the control claims.** If the parameter says reviews happen
quarterly, the export should show four of them.
