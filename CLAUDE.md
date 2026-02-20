# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run all Vitest tests
npm run setup        # Install deps, generate Prisma client, run migrations
npm run db:reset     # Reset database (destructive)
```

Run a single test file:
```bash
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx
```

## Architecture

UIGen is an AI-powered React component generator with live preview. Users chat with Claude AI, which generates and edits React components in a virtual in-memory file system. Changes are streamed in real-time and rendered in a sandboxed preview.

### Core Data Flow

```
User chat input
  → ChatContext (useChat from Vercel AI SDK)
  → POST /api/chat
  → Claude AI executes tool calls (str_replace_editor, file_manager)
  → Streamed tool call results processed by FileSystemContext
  → Virtual file system updated → Preview re-renders
  → Project saved to database
```

### Virtual File System (`src/lib/file-system.ts`)

The entire file system is in-memory only — no disk I/O. Files are stored as a tree of `FileNode` objects, serialized to JSON for persistence in the Prisma `Project.data` column. The `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) is the single source of truth for all file state in the UI.

### AI Tool Integration

Two tools are exposed to Claude at `/api/chat/route.ts`:

- **`str_replace_editor`** — `view`, `create`, `str_replace`, `insert` operations on files
- **`file_manager`** — `rename`, `delete` operations

Both tools operate on a server-side `VirtualFileSystem` instance constructed from the serialized file system sent with each request. Tool call results are streamed back and re-applied to the client-side `FileSystemContext`.

### State Management

Two React contexts manage all client state:

- **`FileSystemContext`** — virtual file system, active file, file operations, processes incoming AI tool calls
- **`ChatContext`** — wraps Vercel AI SDK's `useChat`, manages message history, triggers project saves

### Mock Provider (`src/lib/provider.ts`)

If `ANTHROPIC_API_KEY` is not set, the app uses a `MockLanguageModel` that returns static component code. This allows the UI to work without API costs.

### Authentication

JWT-based with HTTP-only cookies (7-day expiry). Passwords hashed with bcrypt. Anonymous users can create projects stored in `localStorage` via `src/lib/anon-work-tracker.ts`. Projects have an optional `userId`, supporting both authenticated and anonymous workflows.

### Database

Prisma with SQLite (`prisma/dev.db`). Two models: `User` and `Project`. Project `messages` and `data` (file system) are stored as JSON strings.

### Path Alias

`@/*` resolves to `./src/*` (configured in `tsconfig.json`).

### Testing

Vitest with jsdom. Test files live in `__tests__/` directories co-located with the code they test (e.g., `src/components/chat/__tests__/`, `src/lib/contexts/__tests__/`).
