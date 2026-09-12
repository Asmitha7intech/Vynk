# VYNK Database & Data Models

## 1. Primary RDBMS (PostgreSQL 16 via Prisma ORM)

The relational schema strictly enforces referential integrity for student accounts, projects, squads, and gamification events.

### Core Entities:
- **User**: Student/faculty identity, hashed password, role (`STUDENT`, `MENTOR`, `MODERATOR`, `CAMPUS_ADMIN`, `VYNK_ADMIN`), ambassador flag, department, college, XP, level, daily streak.
- **Institution & Department**: Academic hierarchy enabling cross-department matching and verified student email domains.
- **UserSkill & UserInterest**: Granular technical and design skills with proficiency levels and verification evidence.
- **Crew & CrewMember & CrewRole**: Squad formation, open slot management, and signed team agreements.
- **Voyage & VoyageMember**: Showcase projects, repository URLs, live demo links, and star counters.
- **Post, Comment, Reaction**: Real-time social discussions and project updates.
- **DailyChallenge, Quiz, BountyBadge**: Gamified learning challenges and earned milestone credentials.

## 2. High-Speed Cache (Redis 7)
- Session invalidation & token blacklisting.
- User online presence and typing indicators.
- API rate-limiting buckets (200 req/min per IP/token).

## 3. Telemetry Store (MongoDB / HDFS)
- Append-only event logs for campus intelligence analytics.
