# Common master delete-admission isolation

Source: `surumeneco/Eternalia_Novel` develop `d19a3d18d707a61c0d95a71d328061458853a08e`, root tree `f91200b97144ff4081797b65a5e8119c329c6763`.

## Scope

Move the existing pure `deleteAdmission` implementation from `common-masters.service.ts` into `master-delete-admission.ts`; the service imports it and retains the existing module export for the unchanged regression oracle. The current Confirmed Process is `eternalia.master.delete-admission`; it has no observation/action capabilities. No product semantics change and no database calls or authorization move into the pure module.

## Preserved behavior

- Revision mismatch always returns conflict, including when referenced; matching revision with references returns referenced, otherwise allowed.
- Retain service transaction, advisory lock, canonical stored UUID lookup, reference checks, deletion and exception behavior. No authorization or public API changes.
- Preserve existing PostgreSQL test file and all alpha oracles byte-for-byte. The scoped JUnit runner executes the actual pure function and the existing test body, with no DB capability assertion. Actual CI database integration is separate. Formal pure-process interface binding is separate from storage/authorization proof.

## Authorized production paths

`apps/api/src/common-masters.service.ts`, `apps/api/src/master-delete-admission.ts` only. If behavior changes, stop the refactor and return to issue-work.
