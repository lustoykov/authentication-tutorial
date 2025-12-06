# Authentication Tutorial

A production-ready Next.js authentication tutorial demonstrating Supabase auth flows with real session listeners.

## Overview

This project showcases two authentication patterns using Supabase and Next.js 16:

1. **Email + Password** - Classic credentials flow with Supabase-managed sessions and a React listener that never goes stale
2. **Google Login** - Social login via OAuth with automatic UI sync powered by `onAuthStateChange`

## Features

- ✅ Server-side authentication with Supabase SSR
- ✅ Client-side session management with React listeners
- ✅ Protected routes via Next.js proxy (middleware)
- ✅ Automatic token refresh handling
- ✅ Type-safe Supabase client setup

## Prerequisites

- Node.js 18+ 
- A Supabase project ([create one here](https://supabase.com))

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings

### 3. Configure Supabase

#### For Email + Password:
- Enable Email provider in Authentication > Providers

#### For Google Login:
- Enable Google provider in Authentication > Providers
- Add your redirect URL
- Add production redirect URL when deploying

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Project Structure

```
├── app/
│   ├── email-password/     # Email + Password demo
│   ├── google-login/        # Google OAuth demo
│   └── page.tsx             # Home page with demo links
├── lib/
│   └── supabase/
│       ├── browser-client.ts    # Client-side Supabase client
│       └── server-client.ts     # Server-side Supabase client
└── proxy.ts                 # Next.js proxy for protected routes
```

## Key Concepts

### Server Client (`lib/supabase/server-client.ts`)
- Used in Server Components and API routes
- Shares cookies via Next.js `cookies()` API
- Automatically refreshes tokens when needed

### Browser Client (`lib/supabase/browser-client.ts`)
- Used in Client Components
- Singleton pattern for efficiency
- Works with React's `onAuthStateChange` listener

### Proxy (`proxy.ts`)
- Runs on every request
- Protects routes starting with `/protected`
- Redirects unauthenticated users to `/login`

## Demo Pages

- `/email-password` - Email + Password authentication demo
- `/google-login` - Google OAuth authentication demo

## Password Reset Flow

The email/password demo ships with a complete Supabase recovery experience:

1. Click **Forgot password?** while in the sign-in view. The client calls `supabase.auth.resetPasswordForEmail` and sends users to `/email-password?password-reset=true`.
2. Supabase emails the reset link. Configure the Auth **Site URL** and allowed **Redirect URLs** in your project so the link is accepted in local/dev/staging environments.
3. Following the link both signs the user in and flags the recovery session. The page detects `#type=recovery` or the `password-reset` query and surfaces the “Choose a new password” form even though a session exists.
4. Submitting that form calls `supabase.auth.updateUser({ password })` and keeps the new session active so users stay logged in.

If you customize the route, update the `redirectTo` option and allowed redirect URLs in Supabase to match.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- [Next.js 16](https://nextjs.org) - React framework with App Router
- [Supabase](https://supabase.com) - Authentication and backend
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Styling

## Learn More

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Documentation](https://nextjs.org/docs)
