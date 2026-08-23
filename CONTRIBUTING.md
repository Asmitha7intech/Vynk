# Contributing to VYNK

Thank you for your interest in contributing to **VYNK** (*Find your people. Learn. Build. Rise.*)!

## Branching Strategy
- `main` / `master`: Production-ready releases.
- `feat/<feature-name>`: New feature implementations.
- `fix/<bug-name>`: Bug fixes and issue patches.

## Commit Conventions
We adhere to Conventional Commits:
- `feat(crew)`: Add AI recommendation score breakdown
- `fix(quest)`: Fix countdown timer edge case on quiz completion
- `docs(adr)`: Document pgvector similarity indexing

## Code Quality Standards
Before creating a Pull Request, make sure all verification gates pass:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Security & Bug Reports
For security vulnerabilities, please email `security@vynk.app`.
