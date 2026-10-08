# Follow and Current-profile API Audit

Completed on October 8, 2026. The repository and the accessible `travelling-next` client were inspected before implementation. No database migration or data deletion was executed.

## API Impact Map

| Actual operation / consumer | Previous behavior | Implemented change | Compatibility impact | Verification |
| --- | --- | --- | --- | --- |
| `getMemberFollowings(input: FollowInquiry!)` | Matched `followerId`, but paginated before joining `followingId`; missing/deleted members produced sparse pages while `total` counted the raw follow rows. Sort used only `createdAt`. | Joins the `followingId` member first, retains the existing ACTIVE/BLOCK visibility rule, removes missing/DELETE members before both list and count, then sorts by `createdAt` and `_id`. Viewer `meLiked`/`meFollowed` remain aggregate lookups. | Operation, input, result names, and omitted-viewer behavior are retained. Counts can decrease where dangling or deleted targets were previously counted. | Direction, eligibility, count, pagination, tie-break sort, and viewer-id tests pass. |
| `getMemberFollowers(input: FollowInquiry!)` | Matched `followingId`, but paginated before joining `followerId`; it had the same sparse-page/count and unstable-sort issues. | Applies the same pre-facet eligible-member join through `followerId`, deterministic sort, and set-based viewer lookups. | Same operation and response shape. Corrected totals exclude dangling or deleted source members. | Direction and aggregation tests pass. |
| `subscribe(input: String!)` | Authenticated; rejected self-follow; the unique compound index rejected duplicates. Follow creation and two member counter increments were separate writes. | Follow creation and both counter increments now run in one MongoDB transaction. | Operation unchanged. Deployment now requires transaction-capable MongoDB. Duplicate writes remain rejected. | Self-follow and transactional counter tests pass. |
| `unsubscribe(input: String!)` | Authenticated; conditional delete prevented repeated decrements, but delete and counter writes were separate. | Conditional delete and both decrements run in one transaction; negative counter updates are floored at zero. | Operation unchanged. Missing follow still returns an error and does not change counters. | Missing-row and transaction tests pass. |
| `getMember(memberId: String!)` | Public/optional-auth member detail; authenticated views record member views and return like/follow state. | Unchanged because it serves public profile/detail behavior rather than current-account identity. | No contract change. | Existing full suite passes. |
| `getMyProfile` | No dedicated current-member query; UI decoded profile fields from the JWT. | New authenticated query uses only the token-derived `_id`, requires ACTIVE status, and returns a safe projection for account/menu UI. | Additive operation. Clients should use it instead of treating JWT profile claims as current data. | GraphQL and service projection tests pass. |
| `updateMember(input: MyProfileUpdate!)` | Accepted `MemberUpdate`, including client `_id`, role, status, and raw password; returned a newly minted token. | Operation name retained, but input is an explicit self-service allowlist. Identity comes from auth. Omitted fields remain unchanged; `null` clears only optional profile fields. Nick/phone cannot be cleared and remain unique. Output is `MyProfile`, without token or moderation/internal fields. | Intentional breaking input/output tightening for self-profile clients. ADMIN continues using `updateMemberByAdmin(MemberUpdate!)`. | Allowlist, clear semantics, uniqueness, GraphQL contract, frontend typecheck/build pass. |
| `changeMyPassword(input: ChangeMyPasswordInput!)` | No safe password-change operation; raw password was reachable through the general update DTO. | New authenticated mutation verifies current password and stores only the newly generated hash. | Additive operation. Existing login/signup password behavior is unchanged. | Password verification/hash test passes. |
| `imageUploader` / `imagesUploader` | Authenticated upload operations returned stored paths. | Unchanged; `MyProfileUpdate.memberImage` continues to persist the returned path. | No contract change. | Frontend build covers the existing upload document. |
| `updateMemberByAdmin(input: MemberUpdate!)` and member ADMIN queries | ADMIN guard and unrestricted administrative targeting. | Unchanged to preserve established ADMIN permissions and moderation flow. | No change. | Existing full suite and schema generation pass. |
| `MyMenu` frontend | Displayed nick, phone, image, and type from decoded JWT only. | Uses `getMyProfile` with cache-and-network and keeps JWT state only as initial fallback. No menu-specific API was added. | Requires the additive `getMyProfile` query after backend deployment. | Frontend TypeScript and production build pass. |
| `MyProfile` frontend | Sent `_id`, expected `MemberUpdate`, and replaced stored JWT from `updateMember.accessToken`. | Uses `getMyProfile`; sends only `MyProfileUpdate`; refetches current profile after update and no longer expects a token. | Must deploy with the tightened backend mutation contract. | Frontend TypeScript and production build pass. |

## Schemas, Aggregations, and References

- `FollowSchema` retains the unique `{ followingId: 1, followerId: 1 }` constraint and adds query indexes `{ followerId: 1, createdAt: -1, _id: -1 }` and `{ followingId: 1, createdAt: -1, _id: -1 }`.
- `FollowInquiry` keeps `page`, `limit`, and `search`; integer/minimum validation and nested validation were added. The current API has no separate maximum limit, so no new incompatible cap was invented.
- Followings are defined as `followerId = target`, joined through `followingId`. Followers are defined as `followingId = target`, joined through `followerId`.
- The eligible-member join preserves `MemberService.getMember` visibility: ACTIVE and BLOCK are listable; DELETE and missing members are excluded. The same joined stream feeds the page and `metaCounter`.
- Member password is explicitly projected out of aggregation results. `MyProfile` does not expose password, token, status, points, rank, likes, views, comments, warnings, blocks, or deletion metadata.
- Follow list `meLiked` and `meFollowed` are computed from the authenticated viewer in aggregation, not from the viewed profile and not with per-row service queries.
- Member likes and views remain on `getMember`; Product favorites/likes/views, Comments, Articles, and Product ownership are unchanged. Notification has only a schema in this repository and no registered resolver/service, so no runtime notification behavior was invented.
- `memberFollowers` and `memberFollowings` remain denormalized display counters. The follow collection remains the relationship source of truth.

## GraphQL Examples

```graphql
query GetMemberFollowings($input: FollowInquiry!) {
  getMemberFollowings(input: $input) {
    list {
      followingId
      followingData { _id memberNick memberImage }
      meFollowed { myFollowing }
    }
    metaCounter { total }
  }
}
```

```json
{
  input: {
    page: 1,
    limit: 20,
    search: { followerId: TARGET_MEMBER_OBJECT_ID }
  }
}
```

```graphql
query GetMyProfile {
  getMyProfile {
    _id
    memberType
    memberNick
    memberPhone
    memberImage
    memberProducts
    memberArticles
    memberFollowers
    memberFollowings
  }
}

mutation UpdateMember($input: MyProfileUpdate!) {
  updateMember(input: $input) {
    _id
    memberNick
    memberPhone
    memberAddress
  }
}

mutation ChangeMyPassword($input: ChangeMyPasswordInput!) {
  changeMyPassword(input: $input)
}
```

## Deployment and Data Migration Plan

Do not execute these steps automatically:

1. Back up MongoDB and confirm deployment is a replica set or sharded cluster that supports transactions. Subscribe/unsubscribe deliberately fail rather than permit partial counter writes when transactions are unavailable.
2. Inspect duplicate follow pairs before index synchronization:

   ```javascript
   db.follows.aggregate([
     { $group: { _id: { followingId: '$followingId', followerId: '$followerId' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
     { $match: { count: { $gt: 1 } } }
   ])
   ```

3. If duplicates exist, review them explicitly and choose retained records. Do not silently delete them. The existing unique index means a healthy deployed database should already have none.
4. Reconcile `memberFollowers`/`memberFollowings` against grouped follow rows, including zero-count members, after reviewing dangling references. Do not infer counters from the stored member counters themselves.
5. Create/synchronize the two query indexes during a reviewed deployment window. Index declarations alone do not guarantee production index creation when `autoIndex` is disabled.
6. Deploy backend and frontend together for the tightened `updateMember` contract. Existing public member, ADMIN, follow, image, Product, favorite, comment, and article operations do not require renaming.

## Remaining Limits

- There is no follow notification service/resolver to update.
- There is no database-backed integration test environment in this repository; transaction behavior is unit-tested with sessions but still requires a replica-set smoke test.
- JWTs issued at login still contain copied member claims. Current menu/profile rendering now queries the database, but broader token-payload minimization belongs to a separate authentication audit.
- Counter reconciliation and index creation are deployment tasks and were not run.
