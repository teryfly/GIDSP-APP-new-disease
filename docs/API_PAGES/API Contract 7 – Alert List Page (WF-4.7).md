# API Contract 7 – Alert List Page (WF-4.7)

## 1. Page Description

Displays a paginated list of early warning events (AlertEvent) triggered by the system's rule engine detecting anomalies such as case clustering, abnormal symptom patterns, or new disease emergence. Users can filter by alert number, type, occurrence region, detection time, alert level (1-4级), and status (待处理/处理中/已核实/误报/已关闭). The page shows alert metadata, associated case counts, triggering rules, and summary descriptions. Users can navigate to alert details, mark alerts as verified/false-positive, or create case investigation tasks from verified alerts.

## 2. Required DHIS2 APIs

| #    | Endpoint                                                | Method | Description                                                  | Key Parameters                                               | Expected Response / Data Type |
| ---- | ------------------------------------------------------- | ------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------- |
| 1    | `/api/programs`                                         | GET    | Load metadata for alert-related programs (if alerts use tracker or events model) | `filter=name:ilike:alert&fields=id,name,programType`         | Program list                  |
| 2    | `/api/optionSets`                                       | GET    | Load alert type, level, and status option sets for filters   | `filter=name:in:[AlertType,AlertLevel,AlertStatus]&fields=id,name,options[id,code,name,sortOrder]` | OptionSet list                |
| 3    | `/api/organisationUnits`                                | GET    | Load org units for region filter (user accessible scope)     | `filter=path:like:{userOrgUnitPath}&fields=id,name,level,path&paging=false` | OrganisationUnit list         |
| 4    | `/api/dataStore/alerts/metadata`                        | GET    | Fetch alert system configuration (rule definitions, thresholds) | N/A                                                          | { rules: [], thresholds: {} } |
| 5    | `/api/dataStore/alerts/events`                          | GET    | Query alert events with filters (primary data source for table) | Query params embedded in dataStore key pattern or via filtering after retrieval | Alert events array            |
| 6    | `/api/tracker/trackedEntities`                          | GET    | Alternative: If alerts are modeled as tracker TEIs with AlertEvent type | `trackedEntityType={AlertEventType}&orgUnits={ouId}&orgUnitMode=DESCENDANTS&fields=trackedEntity,attributes[attribute,value],enrollments[enrollment,events[event,dataValues[dataElement,value]]]&page={page}&pageSize={pageSize}&filter={filters}&order=createdAt:desc&totalPages=true` | { pager, trackedEntities[] }  |
| 7    | `/api/analytics/events/query/{programUid}`              | GET    | Alternative: Query alerts via event analytics if alerts are stored as program events | `dimension=ou:{ouId};{dataElementId}:{filter}&stage={stageId}&outputType=EVENT&displayProperty=NAME&page={page}&pageSize={pageSize}&paging=true` | Event analytics response      |
| 8    | `/api/tracker/trackedEntities`                          | GET    | Fetch associated cases for alert (linked via relationship or reference field) | `program=PrgCaseMgt1&filter={caseFilter}&fields=trackedEntity,attributes[attribute,value]&paging=false` | TrackedEntity list            |
| 9    | `/api/tracker/relationships`                            | GET    | Fetch relationships between alert TEI and case TEIs          | `trackedEntity={alertTeiUid}&fields=relationship,from,to,relationshipType` | Relationship list             |
| 10   | `/api/dataStore/alerts/events/{alertId}`                | GET    | Fetch single alert detail by ID                              | N/A                                                          | Alert event object            |
| 11   | `/api/dataStore/alerts/events/{alertId}`                | PUT    | Update alert status (待处理→处理中→已核实/误报→已关闭)       | Alert object with updated status field                       | Success response              |
| 12   | `/api/tracker`                                          | POST   | Alternative: Update alert TEI attributes (status, handler, resolution notes) | `importStrategy=UPDATE&atomicMode=OBJECT` with trackedEntities[] | Import summary                |
| 13   | `/api/tracker`                                          | POST   | Create case investigation task from verified alert (new enrollment in investigation program) | `importStrategy=CREATE&atomicMode=OBJECT` with enrollments[] referencing alert | Import summary                |
| 14   | `/api/tracker/trackedEntities/{alertTeiUid}/changeLogs` | GET    | Fetch alert processing audit trail                           | `order=createdAt:desc`                                       | { pager, changeLogs[] }       |
| 15   | `/api/me`                                               | GET    | Get current user info for default handler assignment         | `fields=id,username,displayName,organisationUnits[id,name]`  | User object                   |

## 3. Notes

### Alert Data Model Assumptions

The design document does not explicitly define how alerts are stored in DHIS2. Based on typical implementations, there are three possible approaches:

**Option A: DataStore-based** (Custom JSON storage)

- Alerts stored in `/api/dataStore/alerts/events` namespace
- Each alert is a JSON object with fields: `alertId`, `alertType`, `detectedAt`, `orgUnit`, `level`, `status`, `triggerRule`, `associatedCases[]`, `summary`
- Pros: Flexible schema, easy to query/filter via custom API
- Cons: No native DHIS2 features (sharing, ownership, audit logs)

**Option B: Tracker-based** (Alerts as Tracked Entities)

- Create TrackedEntityType: `AlertEvent`
- Program: `AlertManagement` with stages for processing workflow
- Attributes: `alertNumber`, `alertType`, `detectedAt`, `orgUnit`, `level`, `status`
- Events/DataElements: `triggerRule`, `associatedCaseCount`, `summary`, `handlerNotes`
- Use Relationships to link alert TEI to case TEIs
- Pros: Full DHIS2 features (audit, sharing, ownership), standard API
- Cons: More complex setup, potential performance issues with many alerts

**Option C: Event-based** (Alerts as Program Events)

- Program: `AlertEvents` (event program without registration)
- DataElements for all alert fields
- Each alert occurrence is an event
- Pros: Simple model, good for time-series analysis via analytics
- Cons: No easy way to model status transitions or relationships

**Recommended Approach**: **Option B (Tracker-based)** for production systems, as it aligns with DHIS2's data model and provides audit trails, ownership, and sharing capabilities. Option A is suitable for prototyping.

### API Selection Based on Data Model

The API table above covers **all three options**:

- **APIs 5, 10, 11**: DataStore approach (Option A)
- **APIs 6, 9, 12, 13, 14**: Tracker approach (Option B)
- **API 7**: Event analytics approach (Option C)

For the remainder of this document, **we assume Option B (Tracker-based)** and will use APIs 6, 9, 12, 13, 14.

### Metadata Dependencies (Option B)

- **TrackedEntityType**: `TetAlertEvt` (AlertEvent)

- Program

  : 

  ```
  PrgAlertMgt
  ```

   (AlertManagement)

  - AccessLevel: OPEN or AUDITED (for transparency)
  - Stages:
    - `PsAlertReg` (Alert Registration, non-repeatable, auto-created)
    - `PsAlertProc` (Alert Processing, repeatable for workflow steps)

- Attributes

  :

  - `AtrAlertNo` (alert number, auto-generated, pattern: "ALT-YYYYMMDD-####")
  - `AtrAlertTyp` (alert type, OptionSet: `OsAlertType` - case_cluster, abnormal_symptom, new_disease)
  - `AtrAlertLvl` (alert level, OptionSet: `OsAlertLevel` - LEVEL_1/2/3/4)
  - `AtrDetectDt` (detection datetime)
  - `AtrAlertRgn` (affected org unit, ORGANISATION_UNIT type)
  - `AtrAlertSts` (status, OptionSet: `OsAlertStatus` - PENDING, IN_PROGRESS, VERIFIED, FALSE_POSITIVE, CLOSED)

- Data Elements

   (PsAlertReg):

  - `DeRuleName` (trigger rule name, TEXT)
  - `DeRuleDesc` (rule description, LONG_TEXT)
  - `DeCaseCount` (associated case count, INTEGER)
  - `DeAlertSumm` (alert summary, LONG_TEXT)
  - `DeCaseRefs` (comma-separated case TEI UIDs, LONG_TEXT)

- Data Elements

   (PsAlertProc):

  - `DeProcNote` (processing note, LONG_TEXT)
  - `DeProcStat` (processing status, same as AtrAlertSts)
  - `DeResolvDt` (resolution datetime)

- **RelationshipType**: `RtAlertCase` (AlertEvent → TrackedEntity, bidirectional=false)

### Filter Parameters (API-6)

| UI Filter            | Tracker Filter Syntax                                        |
| -------------------- | ------------------------------------------------------------ |
| Alert Number         | `filter=AtrAlertNo:ilike:{value}`                            |
| Alert Type           | `filter=AtrAlertTyp:eq:{optionCode}`                         |
| Region               | `orgUnits={ouId}&orgUnitMode=DESCENDANTS`                    |
| Detection Time Range | `enrollmentEnrolledAfter={start}&enrollmentEnrolledBefore={end}` (or use attribute filter if enrollment date ≠ detection date) |
| Alert Level          | `filter=AtrAlertLvl:eq:{optionCode}`                         |
| Status               | `filter=AtrAlertSts:eq:{optionCode}`                         |

### Status Transition Workflow (State Machine SM-2.1)

```
待处理 (PENDING) 
  ↓ [User clicks "开始核查"]
处理中 (IN_PROGRESS)
  ↓ [User confirms verification]
已核实 (VERIFIED) ──→ [Create case task] ──→ 已关闭 (CLOSED)
  ↓ [User marks false positive]
误报 (FALSE_POSITIVE) ──→ 已关闭 (CLOSED)
```

Status updates are persisted via API-12 (update attributes) or by creating new events in PsAlertProc stage (API-13 pattern).

### Associated Cases Retrieval

Two approaches:

1. **Via Relationships** (API-9): Query relationships where alert TEI is the `from` entity and case TEIs are the `to` entities
2. **Via Data Element** (API-6 response): Parse `DeCaseRefs` field (comma-separated UIDs) and fetch cases via API-8

### Pagination & Sorting

- Default: `pageSize=50&order=createdAt:desc`
- Support sorting by: `createdAt`, `updatedAt`, `enrolledAt` (maps to detection time), `AtrAlertLvl`
- Use `totalPages=true` for pagination UI

### Access Control

- Program `PrgAlertMgt` should have `accessLevel=AUDITED` to track who accessed alerts
- Alerts visible to users based on org unit scope (search scope for AUDITED, capture scope for PROTECTED)
- Authority `F_TRACKED_ENTITY_INSTANCE_SEARCH` required for querying

### Performance Considerations

- If alert count is high (>10k), consider using `/api/analytics/events/query` (API-7) instead of `/api/tracker/trackedEntities` for better performance
- Cache option sets (API-2) and org units (API-3)
- Use `fields` parameter to minimize response size (avoid including relationships/events in list view)

## 4. Example Request & Response

### API-06: Query Alert Events (Tracker-based, Primary Table Data)

**请求:**

```http
GET /api/tracker/trackedEntities?trackedEntityType=TetAlertEvt&program=PrgAlertMgt&orgUnits=OuSichuan10&orgUnitMode=DESCENDANTS&fields=trackedEntity,createdAt,updatedAt,attributes[attribute,value,displayName],enrollments[enrollment,enrolledAt,status,events[event,programStage,occurredAt,dataValues[dataElement,value]]]&page=1&pageSize=50&order=createdAt:desc&filter=AtrAlertSts:in:[PENDING,IN_PROGRESS]&enrollmentEnrolledAfter=2024-01-01&totalPages=true
```

**响应:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 50,
    "total": 15,
    "pageCount": 1
  },
  "trackedEntities": [
    {
      "trackedEntity": "altTE001",
      "createdAt": "2024-01-15T10:30:00.000",
      "updatedAt": "2024-01-15T10:30:00.000",
      "attributes": [
        { "attribute": "AtrAlertNo", "displayName": "预警编号", "value": "ALT-20240115-012" },
        { "attribute": "AtrAlertTyp", "displayName": "预警类型", "value": "CASE_CLUSTER" },
        { "attribute": "AtrAlertLvl", "displayName": "预警等级", "value": "LEVEL_1" },
        { "attribute": "AtrDetectDt", "displayName": "检测时间", "value": "2024-01-15T10:30:00.000" },
        { "attribute": "AtrAlertRgn", "displayName": "发生地区", "value": "OuChengdu01" },
        { "attribute": "AtrAlertSts", "displayName": "预警状态", "value": "PENDING" }
      ],
      "enrollments": [
        {
          "enrollment": "altEnr001",
          "enrolledAt": "2024-01-15T10:30:00.000",
          "status": "ACTIVE",
          "events": [
            {
              "event": "altEvtReg001",
              "programStage": "PsAlertReg",
              "occurredAt": "2024-01-15T10:30:00.000",
              "dataValues": [
                { "dataElement": "DeRuleName", "value": "7天内同地区同疾病>5例" },
                { "dataElement": "DeRuleDesc", "value": "检测到北京市朝阳区近7天内出现5例新冠肺炎确诊病例" },
                { "dataElement": "DeCaseCount", "value": "5" },
                { "dataElement": "DeAlertSumm", "value": "朝阳区XX街道近7天内发现5例新冠肺炎确诊病例，存在聚集性传播风险" },
                { "dataElement": "DeCaseRefs", "value": "Kj6vYde4LHh,PQfMcpmXeFE,Gjaiu3ea38E,UN810PwyVYO,aVcGf9iO8Xp" }
              ]
            }
          ]
        }
      ]
    },
    {
      "trackedEntity": "altTE002",
      "createdAt": "2024-01-14T15:20:00.000",
      "updatedAt": "2024-01-14T16:00:00.000",
      "attributes": [
        { "attribute": "AtrAlertNo", "displayName": "预警编号", "value": "ALT-20240114-011" },
        { "attribute": "AtrAlertTyp", "displayName": "预警类型", "value": "ABNORMAL_SYMPTOM" },
        { "attribute": "AtrAlertLvl", "displayName": "预警等级", "value": "LEVEL_2" },
        { "attribute": "AtrDetectDt", "displayName": "检测时间", "value": "2024-01-14T15:20:00.000" },
        { "attribute": "AtrAlertRgn", "displayName": "发生地区", "value": "OuMianyang1" },
        { "attribute": "AtrAlertSts", "displayName": "预警状态", "value": "IN_PROGRESS" }
      ],
      "enrollments": [
        {
          "enrollment": "altEnr002",
          "enrolledAt": "2024-01-14T15:20:00.000",
          "status": "ACTIVE",
          "events": [
            {
              "event": "altEvtReg002",
              "programStage": "PsAlertReg",
              "occurredAt": "2024-01-14T15:20:00.000",
              "dataValues": [
                { "dataElement": "DeRuleName", "value": "出现异常症状聚集" },
                { "dataElement": "DeRuleDesc", "value": "浦东区发现3例患者出现相似异常症状" },
                { "dataElement": "DeCaseCount", "value": "3" },
                { "dataElement": "DeAlertSumm", "value": "浦东区发现3例患者出现相似异常症状，疑似新型传染病传播" }
              ]
            },
            {
              "event": "altEvtProc001",
              "programStage": "PsAlertProc",
              "occurredAt": "2024-01-14T16:00:00.000",
              "dataValues": [
                { "dataElement": "DeProcNote", "value": "已联系现场核查小组，预计明日到达现场" },
                { "dataElement": "DeProcStat", "value": "IN_PROGRESS" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### API-09: Fetch Associated Cases via Relationships

**请求:**

```http
GET /api/tracker/relationships?trackedEntity=altTE001&fields=relationship,relationshipType,from[trackedEntity[trackedEntity]],to[trackedEntity[trackedEntity,attributes[attribute,value]]]
```

**响应:**

```json
{
  "relationships": [
    {
      "relationship": "relAC001",
      "relationshipType": "RtAlertCase",
      "from": {
        "trackedEntity": { "trackedEntity": "altTE001" }
      },
      "to": {
        "trackedEntity": {
          "trackedEntity": "Kj6vYde4LHh",
          "attributes": [
            { "attribute": "AtrCaseNo01", "value": "CASE-20240115-0156" },
            { "attribute": "AtrFullNm01", "value": "张三" }
          ]
        }
      }
    },
    {
      "relationship": "relAC002",
      "relationshipType": "RtAlertCase",
      "from": {
        "trackedEntity": { "trackedEntity": "altTE001" }
      },
      "to": {
        "trackedEntity": {
          "trackedEntity": "PQfMcpmXeFE",
          "attributes": [
            { "attribute": "AtrCaseNo01", "value": "CASE-20240115-0155" },
            { "attribute": "AtrFullNm01", "value": "李四" }
          ]
        }
      }
    }
  ]
}
```

### API-08: Fetch Associated Cases by UIDs (Alternative to Relationships)

**请求:**

```http
GET /api/tracker/trackedEntities?program=PrgCaseMgt1&trackedEntities=Kj6vYde4LHh,PQfMcpmXeFE,Gjaiu3ea38E&fields=trackedEntity,attributes[attribute,value,displayName]&paging=false
```

**响应:**

```json
{
  "trackedEntities": [
    {
      "trackedEntity": "Kj6vYde4LHh",
      "attributes": [
        { "attribute": "AtrCaseNo01", "displayName": "个案编号", "value": "CASE-20240115-0156" },
        { "attribute": "AtrFullNm01", "displayName": "姓名", "value": "张三" },
        { "attribute": "AtrDiseaCd1", "displayName": "疾病编码", "value": "OptDiseaB30" }
      ]
    },
    {
      "trackedEntity": "PQfMcpmXeFE",
      "attributes": [
        { "attribute": "AtrCaseNo01", "displayName": "个案编号", "value": "CASE-20240115-0155" },
        { "attribute": "AtrFullNm01", "displayName": "姓名", "value": "李四" },
        { "attribute": "AtrDiseaCd1", "displayName": "疾病编码", "value": "OptDiseaB30" }
      ]
    }
  ]
}
```

### API-12: Update Alert Status (处理中 → 已核实)

**请求:**

```http
POST /api/tracker?importStrategy=UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "trackedEntities": [
    {
      "trackedEntity": "altTE001",
      "trackedEntityType": "TetAlertEvt",
      "orgUnit": "OuChengdu01",
      "attributes": [
        { "attribute": "AtrAlertSts", "value": "VERIFIED" }
      ]
    }
  ],
  "events": [
    {
      "program": "PrgAlertMgt",
      "programStage": "PsAlertProc",
      "enrollment": "altEnr001",
      "trackedEntity": "altTE001",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "occurredAt": "2024-01-15T14:00:00.000",
      "dataValues": [
        { "dataElement": "DeProcNote", "value": "经现场核查，确认为真实预警事件，已启动应急响应流程" },
        { "dataElement": "DeProcStat", "value": "VERIFIED" },
        { "dataElement": "DeResolvDt", "value": "2024-01-15T14:00:00.000" }
      ]
    }
  ]
}
```

**响应:**

```json
{
  "status": "OK",
  "stats": { "created": 1, "updated": 1, "deleted": 0, "ignored": 0, "total": 2 },
  "bundleReport": {
    "typeReportMap": {
      "TRACKED_ENTITY": {
        "stats": { "created": 0, "updated": 1, "total": 1 },
        "objectReports": [ { "trackerType": "TRACKED_ENTITY", "uid": "altTE001", "errorReports": [] } ]
      },
      "EVENT": {
        "stats": { "created": 1, "updated": 0, "total": 1 },
        "objectReports": [ { "trackerType": "EVENT", "uid": "altEvtProc002", "errorReports": [] } ]
      }
    }
  }
}
```

### API-13: Create Case Investigation Task from Verified Alert

**请求:**

```http
POST /api/tracker?importStrategy=CREATE&atomicMode=OBJECT
Content-Type: application/json

{
  "enrollments": [
    {
      "program": "PrgCaseInvest",
      "trackedEntity": "newTaskTE001",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "enrolledAt": "2024-01-15T14:10:00.000",
      "attributes": [
        { "attribute": "AtrTaskName", "value": "朝阳区新冠肺炎聚集性疫情调查" },
        { "attribute": "AtrTaskType", "value": "CASE_INVESTIGATION" },
        { "attribute": "AtrRelatedAlert", "value": "altTE001" },
        { "attribute": "AtrTaskStatus", "value": "PENDING" },
        { "attribute": "AtrAssignedTo", "value": "UserChgd001" }
      ]
    }
  ]
}
```

**响应:**

```json
{
  "status": "OK",
  "stats": { "created": 1, "updated": 0, "deleted": 0, "ignored": 0, "total": 1 },
  "bundleReport": {
    "typeReportMap": {
      "ENROLLMENT": {
        "stats": { "created": 1, "total": 1 },
        "objectReports": [ { "trackerType": "ENROLLMENT", "uid": "taskEnr001", "errorReports": [] } ]
      }
    }
  }
}
```

### API-14: Fetch Alert Processing Audit Trail

**请求:**

```http
GET /api/tracker/trackedEntities/altTE001/changeLogs?program=PrgAlertMgt&order=createdAt:desc&page=1&pageSize=10
```

**响应:**

```json
{
  "pager": { "page": 1, "pageSize": 10 },
  "changeLogs": [
    {
      "createdBy": {
        "uid": "UserChgd001",
        "username": "chengdu_cdc_001",
        "firstName": "李",
        "surname": "娜"
      },
      "createdAt": "2024-01-15T14:00:00.000",
      "type": "UPDATE",
      "change": {
        "attribute": {
          "attribute": "AtrAlertSts",
          "previousValue": "IN_PROGRESS",
          "currentValue": "VERIFIED"
        }
      }
    },
    {
      "createdBy": {
        "uid": "UserWuhou01",
        "username": "wuhou_cdc_001",
        "firstName": "王",
        "surname": "强"
      },
      "createdAt": "2024-01-15T11:00:00.000",
      "type": "UPDATE",
      "change": {
        "attribute": {
          "attribute": "AtrAlertSts",
          "previousValue": "PENDING",
          "currentValue": "IN_PROGRESS"
        }
      }
    },
    {
      "createdBy": {
        "uid": "SYSTEM",
        "username": "system"
      },
      "createdAt": "2024-01-15T10:30:00.000",
      "type": "CREATE",
      "change": {
        "trackedEntity": {
          "trackedEntity": "altTE001"
        }
      }
    }
  ]
}
```

