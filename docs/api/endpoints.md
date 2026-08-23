# VYNK REST API Endpoints Specification

## Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student account with college & department
- `POST /api/auth/login` — Login with email/password & receive JWT access + refresh tokens
- `POST /api/auth/refresh` — Rotate refresh token & receive new access token
- `GET /api/auth/me` — Retrieve authenticated user profile

## Users & Profiles (`/api/users`)
- `GET /api/users/search?q={query}` — Search students, skills, and colleges
- `GET /api/users/:username` — Get full public profile, skills with evidence, and statistics
- `PATCH /api/users/profile` — Update user bio, headline, links, and crew availability
- `POST /api/users/skills` — Add or verify a skill with portfolio evidence URL

## Vynks & Social Graph (`/api/vynks`)
- `GET /api/vynks/connections` — List accepted 1-on-1 connections
- `GET /api/vynks/requests/pending` — List pending incoming connection requests
- `POST /api/vynks/request/:targetUserId` — Send connection proposal
- `POST /api/vynks/requests/:connectionId/accept` — Accept connection request (unlocks DMs)
- `POST /api/vynks/requests/:connectionId/reject` — Decline connection request

## Feed & Posts (`/api/posts`)
- `GET /api/posts/feed` — Get algorithmically ranked social feed
- `POST /api/posts` — Create a post (Discussion, Voyage Launch, Technical Note)
- `POST /api/posts/:id/comments` — Comment on a post
- `POST /api/posts/:id/react` — Toggle reaction / like

## Crews & Matchmaking (`/api/crews`, `/api/matching`)
- `GET /api/crews` — List recruiting hackathon & startup crews
- `POST /api/crews` — Assemble a new crew with open role requirements
- `GET /api/crews/:id` — Inspect crew roster, missing roles, and signed Team Agreement
- `POST /api/crews/:id/join` — Request to join crew
- `GET /api/matching/crew/:crewId` — AI complementary matchmaking ranking for missing squad roles

## Voyages (`/api/voyages`)
- `GET /api/voyages` — Explore project showcase gallery
- `POST /api/voyages` — Showcase a new project portfolio with milestones & links
- `POST /api/voyages/:id/like` — Like a project showcase

## Quests & Learning Arena (`/api/quests`)
- `GET /api/quests/daily-challenge` — Retrieve today's daily technical challenge
- `POST /api/quests/daily-challenge/submit` — Submit daily challenge answer & earn XP
- `GET /api/quests/quizzes` — List weekly competitive timed championships
- `POST /api/quests/quizzes/submit` — Submit timed quiz, calculate score, evaluate weak topics & next recommended lessons

## Mentorship (`/api/mentors`)
- `GET /api/mentors` — Browse verified mentors by technical category
- `POST /api/mentors/profile` — Create or update mentor profile
- `POST /api/mentors/request` — Propose goal-driven mentorship session

## Realtime Messages (`/api/messages`)
- `GET /api/messages/conversations` — List active conversations
- `GET /api/messages/conversations/:id/messages` — Get conversation message history
- `POST /api/messages/send` — Send message (enforces accepted Vynk, Crew, or Mentor checks)

## Leaderboards & Gamification (`/api/gamification`)
- `GET /api/gamification/leaderboard?scope={GLOBAL|COLLEGE|DEPARTMENT|WEEKLY}` — Get rank standings
- `GET /api/gamification/badges` — List all unlockable Bounties
