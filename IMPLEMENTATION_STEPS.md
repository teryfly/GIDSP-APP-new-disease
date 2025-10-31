# DHIS2 v2.42 tracker API migration - Plan

1) Update dhis2.ts to use v2.42 tracker endpoints and field names
   - Purpose: Switch to /api/tracker/trackedEntities and /api/tracker/events; rename fields (enrollmentDate->enrolledAt, incidentDate->occurredAt, trackedEntityInstance->trackedEntity); add tracker import report parsing helper.
   - Output: Updated functions:
     * createTEIAndEnrollment(): POST /api/tracker/trackedEntities
     * createEvent(): POST /api/tracker/events
     * extractIdsFromTrackerReport(): utility to read created IDs
   - Keep existing read-only GETs; retain checkIdDuplicate with legacy endpoint as it’s a search.

2) Update pages/NewCase.tsx submission payload and response handling
   - Purpose: Align payload field names with v2.42 and utilize response parsing helper to extract trackedEntity and enrollment IDs; update event payload fields (occurredAt, trackedEntity).
   - Output: Updated NewCase.tsx with enrolledAt/occurredAt, trackedEntity in event, and new import usage.

---

## WF-4.2 个案列表页 (Case List) - Live DHIS2 Integration

A) Create DHIS2 API client utilities
   - Purpose: Centralize HTTP with basic auth from src/config.json
   - Output: src/api/dhis2Client.ts

B) Case services for Contract 2
   - Purpose: Implement required endpoints
   - Output: src/services/caseService.ts
     * getProgramMetadata (API 1)
     * getOptionSet (API 2,3)
     * getMe (user org units)
     * getOrgUnitsByPath (API 4)
     * queryTrackedEntities (API 5) with filters/pagination/sorting
     * deleteTrackedEntity (API 6)
     * batchPushToEpi (API 7)

C) Mapping helpers
   - Purpose: Convert tracker payload to table rows
   - Output: src/services/mappers/caseMappers.ts

D) Common components & hooks
   - Output:
     * src/components/common/OrgUnitSelect.tsx (API 4 + me scope)
     * src/hooks/useDebouncedValue.ts (debounced search)

E) Replace CaseList with live page
   - Output: src/pages/CaseList.tsx
   - Features:
     * Filter form (caseNo, patientName, disease, date range, status, org unit)
     * Table with selection, sorting, tooltips, row click/dblclick
     * Pagination with total
     * Actions: View, Delete (API 6), Batch Push (API 7), Export CSV
     * “高级筛选” placeholder