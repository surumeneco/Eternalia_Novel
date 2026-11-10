# CAT Draft — AC-56 item-level author edit link (exploratory)

Status: Draft, not Confirmed. Scope: a published chapter reader page offers a direct link to the existing author Studio editor only when the session is authenticated as the authorized author.

## Proposed invariant

- Author viewing a published chapter sees an item-specific edit link. Following it navigates to `/studio?item=<chapter-id>` and loads the matching editor, without mutating the published snapshot.
- Anonymous reader sees no author edit link, cannot use the Studio editor, and cannot write through admin APIs.
- A link is navigation only, never authorization; backend author checks remain authoritative.

## Exploratory tests

1. Authenticated synthetic author visits a published chapter, clicks `この項目を編集`, and lands in the editor for that exact chapter ID.
1b. Authenticated synthetic author visits a published series detail page and follows the item-specific edit link to the editor for that exact series ID; anonymous readers see no such link.
2. Anonymous reader visits the same chapter and sees no item-specific author edit link.
3. Existing shared footer author navigation and anonymous Studio/API protections remain green.

Real Discord OAuth, all legacy item types, human UX acceptance and formal CAT process/model/implementation gates are not-run. This Draft is not normative confirmation.
