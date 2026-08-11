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
│   ├── server/          # Backend code (Express routes, handlers)
│   ├── shared/          # Shared types and utilities
│   └── test/            # Test files
├── assets/              # Static assets
├── .github/             # GitHub workflows and templates
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Docker compose configuration
└── vite.config.ts       # Vite bundler configuration
```

**Protected files (do not modify):**
- `src/shared/types.ts` - Core type definitions
- `src/server/routes/*` - Server route handlers
- `tsconfig.json` - TypeScript configuration

## Coding Conventions

### TypeScript

- Use TypeScript strict mode
- Export types alongside interfaces
- Prefer `type` for simple unions/aliases, `interface` for objects

### React

- Use functional components with hooks
- Prefer TypeScript generics in component props
- Use `motion` from Framer Motion for animations
- Follow the existing tailwind patterns

### Backend (Express)

- Route handlers should be in `src/server/routes/`
- Use async/await for route handlers
- Validate request types with the shared types

### Git

- Use atomic commits with clear messages
- Create feature branches from `develop` or `main`
- Pull request to `main` or `develop` (as appropriate)

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

This project is licensed under the MIT License - see the LICENSE file for details.