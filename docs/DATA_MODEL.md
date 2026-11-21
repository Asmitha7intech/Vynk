# VYNK Database Model & Schema Architecture

## Overview
VYNK's relational persistence layer is managed by Prisma ORM backed by PostgreSQL in production and a lightweight fallback `LocalStoreEngine` in local zero-dependency environments. All operations adhere to strict foreign-key referential integrity, unique constraints, and auditable event timestamps.

---

## 1. Core Identity & User Models

### `User`
Primary entity representing a student, mentor, or campus admin.
- `id` (String, UUID, Primary Key)
- `email` (String, Unique, Indexed)
- `username` (String, Unique, Indexed)
- `displayName` (String)
- `passwordHash` (String)
- `college` (String, Indexed)
- `department` (String, Indexed)
- `graduationYear` (Int?)
- `role` (Enum: `STUDENT`, `MENTOR`, `ADMIN`, etc.)
- `xp` (Int, Default: 50, Indexed)
- `level` (Int, Default: 1)
- `reputationScore` (Int, Default: 100)
- `streakDays` (Int, Default: 1)
- `createdAt`, `updatedAt` (DateTime)

### `Session`
Server-side active device sessions for token revocation and security tracking.
- `id` (String, Primary Key)
- `userId` (String, Foreign Key -> `User.id`, Cascade)
- `tokenHash` (String, Unique)
- `userAgent` (String?)
- `ipAddress` (String?)
- `expiresAt` (DateTime)
- `createdAt` (DateTime)

### `UserSkill`
Verified technical strengths linked to students.
- `id` (String, Primary Key)
- `userId` (String, Foreign Key -> `User.id`, Cascade)
- `skillName` (String, Indexed)
- `category` (String)
- `proficiency` (Enum: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`)
- `isVerified` (Boolean, Default: false)
- **Constraint**: `@@unique([userId, skillName])`

---

## 2. Social Graph & Connections

### `Connection` (VYNKs)
Represents peer connections between two students.
- `id` (String, Primary Key)
- `senderId` (String, Foreign Key -> `User.id`)
- `receiverId` (String, Foreign Key -> `User.id`)
- `status` (Enum: `PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`)
- `createdAt`, `updatedAt` (DateTime)
- **Constraint**: Unique connection pair per student tuple

---

## 3. Builder Stream & Posts

### `Post`
Feed dispatch created by an authenticated builder.
- `id` (String, Primary Key)
- `authorId` (String, Foreign Key -> `User.id`, Cascade)
- `type` (Enum: `TEXT`, `VOYAGE_LAUNCH`, `HACKATHON_DISPATCH`, `LEARNING_NOTE`, `QUESTION`, `OPPORTUNITY`)
- `title` (String?)
- `content` (String, Text)
- `mediaUrls` (String[])
- `tags` (String[])
- `voyageId` (String?, Foreign Key -> `Project.id`)
- `createdAt`, `updatedAt` (DateTime)
- **Ordering**: Deterministic sort by `createdAt DESC`

### `Comment`
Discussion response attached to a post.
- `id` (String, Primary Key)
- `postId` (String, Foreign Key -> `Post.id`, Cascade)
- `authorId` (String, Foreign Key -> `User.id`, Cascade)
- `parentId` (String?, Self-referential Foreign Key for nested replies)
- `content` (String)
- `createdAt` (DateTime)

### `PostReaction`
Idempotent emoji reactions on posts.
- `id` (String, Primary Key)
- `postId` (String, Foreign Key -> `Post.id`, Cascade)
- `userId` (String, Foreign Key -> `User.id`, Cascade)
- `emoji` (String, Default: '🔥')
- **Constraint**: `@@unique([postId, userId])`

---

## 4. Communities

### `Community`
Campus hubs scoped by interest, technology, or academic domain.
- `id` (String, Primary Key)
- `name` (String, Unique)
- `slug` (String, Unique, Indexed)
- `description` (String)
- `category` (String)
- `tags` (String[])
- `creatorId` (String, Foreign Key -> `User.id`)
- `isPrivate` (Boolean, Default: false)
- `createdAt`, `updatedAt` (DateTime)

### `CommunityMember`
Membership state with role-based governance.
- `id` (String, Primary Key)
- `communityId` (String, Foreign Key -> `Community.id`, Cascade)
- `userId` (String, Foreign Key -> `User.id`, Cascade)
- `role` (Enum: `ADMIN`, `MODERATOR`, `MEMBER`)
- `status` (Enum: `APPROVED`, `PENDING`, `REJECTED`)
- `joinedAt` (DateTime)
- **Constraint**: `@@unique([communityId, userId])`

---

## 5. Projects (Voyages)

### `Project` / `Voyage`
Living student project portfolio showcase.
- `id` (String, Primary Key)
- `title` (String)
- `slug` (String, Unique, Indexed)
- `tagline` (String)
- `description` (String)
- `category` (String)
- `techStack` (String[])
- `creatorId` (String, Foreign Key -> `User.id`)
- `githubUrl`, `liveUrl` (String?)
- `status` (Enum: `IDEA`, `IN_PROGRESS`, `SHIPPED`)
- `starsCount` (Int, Default: 0)
- `createdAt`, `updatedAt` (DateTime)

### `ProjectJoinRequest`
Collaboration applications submitted to join a project crew.
- `id` (String, Primary Key)
- `projectId` (String, Foreign Key -> `Project.id`, Cascade)
- `applicantId` (String, Foreign Key -> `User.id`, Cascade)
- `roleName` (String)
- `message` (String)
- `skills` (String[])
- `status` (Enum: `PENDING`, `ACCEPTED`, `REJECTED`)
- `createdAt` (DateTime)

---

## 6. Real-Time Messaging

### `Conversation`
Direct peer-to-peer or squad chat channel.
- `id` (String, Primary Key)
- `type` (Enum: `DIRECT`, `CREW`, `MENTOR`)
- `createdAt`, `updatedAt` (DateTime)

### `ConversationMember`
Authorization bridge verifying room admission.
- `id` (String, Primary Key)
- `conversationId` (String, Foreign Key -> `Conversation.id`, Cascade)
- `userId` (String, Foreign Key -> `User.id`, Cascade)
- `joinedAt` (DateTime)
- **Constraint**: `@@unique([conversationId, userId])`

### `Message`
Durable chat record persisted before broadcast.
- `id` (String, Primary Key)
- `conversationId` (String, Foreign Key -> `Conversation.id`, Cascade)
- `senderId` (String, Foreign Key -> `User.id`)
- `content` (String)
- `createdAt` (DateTime, Indexed)

---

## 7. Gamification & Auditable Telemetry

### `XPTransaction`
Immutable ledger of all points awarded on the platform.
- `id` (String, Primary Key)
- `userId` (String, Foreign Key -> `User.id`, Cascade)
- `amount` (Int)
- `reason` (String)
- `sourceType` (Enum: `QUEST`, `VOYAGE`, `HACKATHON`, `STREAK`)
- `sourceId` (String?)
- `createdAt` (DateTime)

### `AnalyticsEvent`
Operational and big data telemetry stream.
- `id` (String, Primary Key)
- `eventName` (String, Indexed)
- `userId` (String?, Foreign Key -> `User.id`)
- `metadata` (JSONB)
- `createdAt` (DateTime, Indexed)
