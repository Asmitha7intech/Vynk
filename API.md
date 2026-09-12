# VYNK API Specification (v1)

Base URL: `/api/v1` (also aliased at `/api`)

### Authentication (`/auth`)
- `POST /auth/register` — Register new student/faculty account with department & college.
- `POST /auth/login` — Authenticate and receive JWT access & refresh tokens.
- `POST /auth/refresh` — Rotate expired access tokens using refresh token.
- `GET /auth/me` — Retrieve authenticated user profile with skills, badges, and interests.

### Users & Social Discovery (`/users`)
- `GET /users/profile` — Retrieve logged-in user profile.
- `PATCH /users/profile` — Update profile headline, bio, college, and social links.
- `GET /users/:username` — Get full public portfolio of a student.
- `GET /users/search?q=` — Full-text and skill search across campus.
- `GET /users/cross-department` — AI cross-department complementary student discovery.
- `POST /users/skills` — Add or verify a technical/design skill.

### Vynks Social Graph (`/vynks`)
- `GET /vynks/connections` — Get confirmed 1-on-1 student connections.
- `GET /vynks/requests/pending` — List pending inbound connection invites.
- `POST /vynks/request/:targetUserId` — Send connection request.
- `POST /vynks/accept/:connectionId` — Accept connection request.
- `POST /vynks/reject/:connectionId` — Decline connection request.

### Campus Feed (`/posts`)
- `GET /posts/feed?limit=20&cursor=` — Cursor-paginated campus feed.
- `POST /posts` — Publish project update, question, or accomplishment.
- `POST /posts/:id/react` — Toggle reaction emoji on post.
- `POST /posts/:id/comments` — Add comment to post discussion.

### Crews & Squads (`/crews`)
- `GET /crews` — Browse open hackathon and startup squads.
- `GET /crews/:id` — Get crew details and open team slots.
- `POST /crews` — Create a new project squad.
- `POST /crews/:id/join` — Apply for a specific role slot.
- `POST /crews/:id/sign-agreement` — Electronically sign team collaboration agreement.

### AI Matchmaking (`/matching`)
- `GET /matching/crews/:crewId/recommendations` — Complementarity score and suggested teammates.

### Gamification & Quests (`/gamification`, `/quests`)
- `GET /gamification/leaderboard?scope=GLOBAL` — Real-time student XP leaderboard.
- `GET /gamification/rank-explanation/:userId` — Transparent factor breakdown for student rank.
- `GET /quests/daily-challenge` — Today's technical challenge.
- `POST /quests/daily-challenge/submit` — Submit answer for daily XP reward.

### Big Data & Campus Intelligence (`/analytics/bigdata`)
- `GET /analytics/bigdata/campus-heatmap` — Skill distribution across departments.
- `GET /analytics/bigdata/dept-collaboration` — Inter-department collaboration frequency matrix.
- `GET /analytics/bigdata/skill-demand` — Campus skill demand vs supply gap metrics.
