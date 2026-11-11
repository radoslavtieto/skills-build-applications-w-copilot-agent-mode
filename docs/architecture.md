# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Keep implementation aligned with these tier responsibilities and contracts.

- Presentation tier decision: Keep the existing React Router pages and shared `getJson` API client. Each capability component owns its loading, empty, error, and successful-data presentation; API/business rules and persistence stay out of the UI.
- Logic tier decision: Keep Express route handlers thin and delegate capability behavior to `services/octofitService.ts`. Return deliberate 4xx responses for invalid input, malformed or missing references, and unknown users rather than exposing cast or validation failures as 500s.
- Data tier decision: Express persistence requirements in Mongoose schemas, including required fields, references, and appropriate defaults. Keep seeding idempotent and preserve unrelated existing records.
- Activity tracking approach: Validate the requested user and team IDs and confirm both records exist before creating an activity. Persist the associated user/team, type, and minutes, with points and occurrence time computed by the server; list persisted activities through the API.
- Team management approach: Require a name, preserve the submitted name and mascot, and default omitted members to an empty array. Create and list teams through the service and return their member references to the presentation tier.
- Leaderboard approach: Aggregate activity points by team, sort totals descending, and assign ranks starting at 1; return the team name and total with each rank.
- Workout suggestions approach: Resolve the requested email to a user, then use that user's goal and recent activity to select matching workout suggestions. Include a human-readable reason for the first suggestion and return a deliberate 4xx when the user is unknown.

Implement in dependency order: data schemas and seed invariants first, service/API behavior second, and presentation integration and states third. Keep each step scoped to its contract tests before moving to the next tier.

## Test plan

Baseline results below were recorded before implementation changes. Use these commands after each relevant tier change; a passing build checks compilation/bundling, while the contract suites check behavior.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` - baseline fails 4 of 5 tests because required User, Team, Activity, and Workout schema constraints are missing or incomplete. The seed idempotency test passes; keep it passing while fixing schema validation.
- Logic/API tier: `npm run test:api --prefix octofit-tracker/backend` - baseline fails all 4 tests: invalid activity/team input receives 501 rather than a 4xx validation response, the leaderboard is empty, and workout suggestions omit the required reason. These failures identify unfinished service behavior and response contracts.
- Presentation tier: `npm test --prefix octofit-tracker/frontend` - baseline fails all 15 tests across the four views. Data rendering, user-specific workout requests, loading states, empty states, and accessible API error states are not implemented; the views currently show an implementation-pending state.
- Backend build: `npm run build --prefix octofit-tracker/backend` - passes at baseline. A failure indicates a TypeScript compile/type error in the backend.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` - passes at baseline. A failure indicates a TypeScript or Vite production-bundle error.
