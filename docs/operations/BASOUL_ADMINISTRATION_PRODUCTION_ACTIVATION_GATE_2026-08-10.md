# BASOUL Administration Production Activation Gate

Date: 2026-08-10
Scope: Production Supabase `okghyypmkymxvtsuvdvb`
Status: PREPARED — NOT AUTHORIZED FOR PRODUCTION MUTATION

## Purpose
Activate the already implemented BASOUL organization administration model (Owner / Admin / Member / Viewer) on Production without weakening RLS, exposing service-role credentials, or changing unrelated Production schema.

## Verified current Production state
Read-only inspection found:
- `organization_memberships` and `organizations` have RLS enabled, but FORCE RLS is not enabled.
- Legacy `organizations_update_admin` policy remains present.
- `set_organization_membership(...)` and `remove_organization_membership(...)` exist, but their deployed definitions predate the hardened PR #60 versions and do not include the current administration audit writer / explicit session guard.
- `organization_invitations` does not exist.
- `create_organization_invitation`, `change_organization_member_role`, `deactivate_organization_member`, invitation acceptance/revoke/attach RPCs do not exist.
- Edge Function `organization-admin` is not deployed.
- Existing active membership data already includes owner, admin, and member roles. This activation must preserve those rows.

## Verified Staging reference
Staging `ogqdfucxwjutkpoahezn` contains and previously validated:
1. `basoul_administration_boundaries`
2. `secure_member_invitations`
3. `administration_audit_actions`
4. `invitation_audit_index`
5. Active Edge Function `organization-admin` with JWT verification enabled.

## Canonical repository sources
- `supabase/migrations/20260809193000_basoul_administration_boundaries.sql`
- `supabase/migrations/20260809175830_secure_member_invitations.sql`
- `supabase/migrations/20260809181500_administration_audit_actions.sql`
- `supabase/migrations/20260809182500_invitation_audit_index.sql`
- `supabase/functions/organization-admin/index.ts`
- `supabase/functions/organization-admin/deno.json`

## Required Production activation order
The migration dependency order must be checked immediately before execution. Because the invitation migration calls `private.record_administration_event`, Production activation must ensure the hardened administration-boundary function exists before invitation workflows are exercised. Apply only canonical repository SQL, using Supabase migration operations rather than ad-hoc DDL.

Proposed controlled sequence:
1. Preflight snapshot: migration list, policies, RLS/FORCE-RLS flags, RPC definitions, membership counts by role/status.
2. Apply hardened administration boundaries.
3. Apply secure member invitations.
4. Apply administration audit action constraints.
5. Apply invitation audit index.
6. Deploy `organization-admin` with `verify_jwt=true`.
7. Read-only postflight verification of objects, grants, policies, FORCE RLS, function definitions, and membership row counts.
8. Functional security matrix using authenticated accounts: Owner, Admin, Member, Viewer, Unknown.
9. Verify Owner/Admin management actions, Member/Viewer denial, invitation flow, role changes, deactivation/removal, and administration audit events.
10. Verify ordinary product CRUD remains unaffected and no cross-organization visibility regression is introduced.

## Hard safety conditions
- Do not weaken or disable RLS.
- Do not expose or copy the service-role key to client code, logs, docs, or chat.
- `organization-admin` must require a valid JWT.
- Do not allow Owner role invitation through the normal member invitation flow.
- Do not alter unrelated Auth configuration, domains, signing IDs, Production identifiers, or billing.
- Preserve existing membership rows and organization ownership.
- Stop immediately on unexpected schema drift, policy conflict, membership-count change, or permission broadening.

## Roll-forward / failure handling
The migrations are security-sensitive and are not to be casually reversed in Production. If a postflight check fails, stop further rollout, preserve evidence, disable access to newly introduced administration UI/actions at the application layer if necessary, and prepare a reviewed corrective migration. Do not delete membership or invitation data to "restore" state.

## Approval boundary
Production migration application and Edge Function deployment are intentionally blocked until the owner explicitly approves activation of administration on Production.
