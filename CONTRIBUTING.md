# Contributing to Hermes Hive

Thank you for your interest in contributing to Hermes Hive! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Conventions](#coding-conventions)
- [Commit Conventions](#commit-conventions)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Testing](#testing)

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (v1.3.14 or higher) - Package manager and runtime
- Node.js 20+ (for production builds)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hermes-hive
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Project Structure

```
hermes-hive/
├── src/
│   ├── client/          # Frontend code (React, Tailwind, motion)
│   ├── server/          # Backend code (Express middleware, engines)
│   ├── shared/          # Shared types and utilities
│   └── test/            # Vitest suites (node env, globals)
├── docs/                # Vision doc + auto-exported human queue
├── hive-core/           # Swarm machinery (build-in-repo → gate → promote)
├── homepage/            # Static landing pages
├── .github/             # GitHub workflows and templates
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Docker compose configuration
└── vite.config.ts       # Vite bundler configuration
```

**Protected files (do not modify):**
- `src/shared/types.ts` - Core type definitions
- `src/server/apiMiddleware.ts` - API middleware entry point
- `tsconfig.json` - TypeScript configuration
- `.hive/` - live SwarmMonitor DB + swarm state (never edit manually)

## Coding Conventions

### TypeScript

- Write type-safe TypeScript; verify with `bun run lint` (tsc --noEmit)
- Export types alongside interfaces
- Prefer `type` for simple unions/aliases, `interface` for objects

### React

- Use functional components with hooks
- Prefer TypeScript generics in component props
- Use `motion` (imported from `motion/react`) for animations
- Follow the existing tailwind patterns

### Backend (Express)

- API routes live in `src/server/apiMiddleware.ts` (Connect-style middleware; no `src/server/routes/` dir)
- Use async/await in the request handler — the top-level try/catch normalizes errors (ValidationError/NotFoundError/AuthError → structured status codes)
- Fire-and-forget async handlers (timers, signal handlers, onClick/onSubmit) must catch their own rejections — a throw escaping an event callback is an unhandled rejection, not a recoverable error
- Validate request types with the shared types

### Async Error Handling

- Every async function invoked fire-and-forget (setInterval/setTimeout callbacks, process.on handlers, React event handlers) needs try/catch or .catch — see the guarded patterns in `src/client/utils/pollLoop.ts` and `src/server/tasks/taskWorker.ts`
- `try/finally` alone does NOT contain a rejection — pair it with `catch`
- Awaited call chains (API middleware → engines) rely on the outer handler's try/catch; bare `throw`s inside route-adjacent code become 4xx/5xx responses

### Git

- Use atomic commits with clear messages
- Work on feature branches from `main` (e.g. `fix/config-docs`); swarm cycles use `swarm-<sid>-c<cycle>-agent-<n>` worktree branches
- Pull request to `main` (as appropriate)

## Commit Conventions

We use conventional commit messages:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code formatting, missing semicolons, etc.
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding tests, correcting tests
- `chore:` Changes to build process or auxiliary tools

Example:
```
feat: add user authentication endpoint
```

## Running the Application

### Development

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

### Linting

```bash
bun run lint
```

### Fixing Lint Errors

```bash
bun run lint:fix
```

## Building for Production

```bash
bun run build
```

The output will be in the `dist/` directory.

### Preview Production Build

```bash
bun run preview
```

## Testing

### Run Tests

```bash
bun run test
```

### Run Tests with Coverage

```bash
bun run test:coverage
```

### Docker

Build the Docker image:

```bash
docker build -t hermes-hive .
```

Run with Docker Compose:

```bash
docker-compose up
```

## License

This project is licensed under the MIT License.