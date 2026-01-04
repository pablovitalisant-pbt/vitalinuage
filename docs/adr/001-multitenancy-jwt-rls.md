# ADR 001: Multitenancy Strategy (JWT & Pydantic)

## Status
Accepted

## Context
We needed to implement multitenancy to ensure data isolation between doctors (users) in the Vitalinuage/Log10 application. The key requirements were security, reversibility (PBT-IA principle), and minimal impact on the frontend.

## Decision 1: JWT `sub` as `owner_id`
We vetted utilizing the `sub` field (email) from the JWT access token as the source of truth for the `owner_id`.
*   **Why:** It is tamper-proof (signed by backend), ubiquitous in every request, and avoids passing a mutable user ID from the client side.
*   **Implementation:** The backend dependency `get_current_user` extracts the email and injects it into CRUD operations.

## Decision 2: Pydantic `populate_by_name`
We encountered a naming convention mismatch:
*   Frontend (React/TS): Uses `camelCase` (e.g., `ownerId`, `firstName`).
*   Backend (Python/SQL): Uses `snake_case` (e.g., `owner_id`, `first_name`).

Instead of rewriting the entire frontend or backend, we utilized Pydantic's `ConfigDict(populate_by_name=True)`.
*   **Why:** This allows the API to accept `ownerId` from the frontend (if needed) or serialize `owner_id` as `ownerId` automatically, facilitating smooth integration without massive refactoring.
*   **Constraint:** The `owner_id` field itself is currently filtered out/injected by the backend, but the configuration ensures future fields align correctly.

## Consequences
*   **Positive:** Strong data isolation; clean frontend-backend contract.
*   **Negative:** Tight coupling between auth token structure and data ownership (changing email might require migration, though `id` is the primary key, we store `owner_id` as string currently).
