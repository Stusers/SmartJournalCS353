# Clerk Authentication Documentation

This document outlines the implementation of Clerk for user authentication in the SmartJournal application.

## Overview

Clerk is used as the primary authentication provider, handling user sign-up, sign-in, and session management. The application integrates with Clerk on both the frontend and backend to provide a seamless and secure authentication experience.

The core of the integration lies in using Clerk for the UI and token generation on the frontend, and then validating that token on the backend. A local database `users` table stores application-specific user data, linked to Clerk users via a `clerk_id`.

## Backend Implementation

The backend is responsible for protecting API routes and associating Clerk users with local database records.

### `clerkAuth.ts` Middleware

This Express middleware is the cornerstone of the backend authentication. It is applied to all protected routes.

**Functionality:**

1.  **Extracts Token**: It retrieves the JWT from the `Authorization: Bearer <token>` header of incoming requests.
2.  **Verifies Token**: It uses the `@clerk/backend` library and the `CLERK_SECRET_KEY` to verify the token's validity. It decodes the token to extract the `clerkUserId`.
3.  **Fetches Clerk User**: It calls the Clerk API to get the full user object, ensuring the user exists in Clerk's system.
4.  **Database Sync**: It calls the `createOrGetUserByClerkId` function to either retrieve an existing user from the local `users` table or create a new one if they don't exist.
5.  **Attaches User to Request**: It attaches both the `clerkUserId` and the local database `userId` to the Express `request` object, making them available to downstream controllers.

### Database Integration

#### `functions/users.ts`

This file contains the database logic for managing users in relation to their Clerk identity.

-   `getUserByClerkId(clerkId)`: Retrieves a user from the local database using their Clerk ID.
-   `createOrGetUserByClerkId(clerkId, email, username)`: This is a key function for syncing Clerk users with the local database.
    -   It first tries to find a user by `clerkId`.
    -   If not found, it tries to find a user by `email`. If a user with that email already exists, it updates that user's record with the `clerkId` to link the accounts.
    -   If no user is found by either `clerkId` or `email`, it creates a new user in the `users` table with the provided Clerk details.

#### Schema and Migrations

-   `db/schema.sql`: The `users` table is defined with a `clerk_id` column, which is set to be `UNIQUE`.
-   `db/migrate-clerk-id.ts`: A migration script is provided to add the `clerk_id` column to existing databases, ensuring backward compatibility.

### Protected Routes

Routes in `routes/*.ts` (e.g., `journalRoutes.ts`, `userRoutes.ts`) use the `clerkAuth` middleware to ensure that only authenticated users can access them.

```typescript
// Example from journalRoutes.ts
router.use(clerkAuth);
```

## Frontend Implementation

The frontend uses `@clerk/clerk-react` to handle the user interface for authentication and to manage the user's session state.

### `main.tsx`

The root of the React application is wrapped with the `<ClerkProvider>`.

-   It is configured with the `VITE_CLERK_PUBLISHABLE_KEY` from the environment variables.
-   This provider makes all of Clerk's hooks and components available throughout the application.

### `context/AuthContext.tsx`

This file provides a custom `useAuth` hook that acts as a bridge between Clerk's authentication state and the application's own user context.

**Functionality:**

1.  **Clerk Hooks**: It uses `useUser` from Clerk to get the currently authenticated Clerk user and `useClerkAuth` to get the `getToken` and `signOut` functions.
2.  **Database User Fetching**: When a Clerk user is authenticated, an effect is triggered:
    -   It calls `getToken()` to get the user's session JWT.
    -   It makes a `GET` request to the backend's `/api/users/me` endpoint, including the token in the `Authorization` header.
    -   The backend verifies the token (using the `clerkAuth` middleware) and returns the corresponding user from the local database.
    -   The fetched database user is then stored in the `dbUser` state.
3.  **Provides Unified State**: The `useAuth` hook returns a consistent interface for the rest of the application, including the local database `user` object and an `isAuthenticated` flag.

### `components/Login.tsx`

This component uses the `<SignIn>` component provided by `@clerk/clerk-react` to render Clerk's pre-built login form.

### `App.tsx`

The main `App` component uses `useUser` to check if the user is authenticated with Clerk and conditionally renders either the `Login` component or the main application content.

## Authentication Flow

1.  A new user visits the site and is presented with the Clerk `<SignIn>` component.
2.  The user signs up or signs in through the Clerk interface.
3.  Upon successful authentication, the Clerk React SDK securely stores the session token in the browser.
4.  The `AuthContext`'s `useEffect` hook is triggered because a Clerk user is now available.
5.  The `AuthContext` gets the JWT from Clerk using `getToken()`.
6.  It sends this token to the backend API (e.g., `/api/users/me`).
7.  The `clerkAuth` middleware on the backend verifies the token.
8.  The `createOrGetUserByClerkId` function finds the corresponding user in the database or creates a new one.
9.  The backend returns the local user data to the frontend.
10. The frontend stores this local user data in its state, and the user is now fully logged into the application.
11. All subsequent API requests from the frontend include the Clerk JWT, which the backend verifies on each call.
