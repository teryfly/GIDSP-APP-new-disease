# API Contract 1 – Dashboard Page (WF-4.1) 

## 1. Page Description

Dashboard is the landing page after user login, providing an overview of key metrics, pending tasks, recent activities, and quick action shortcuts. It displays aggregated statistics for **case management** and **unknown disease surveillance**, along with actionable items requiring user attention.

## 2. Required DHIS2 APIs

| #    | Endpoint                                      | Method | Description                                      | Key Parameters                                               | Expected Response / Data Type         |
| ---- | --------------------------------------------- | ------ | ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------- |
| 1    | `/api/me`                                     | GET    | Get current user information                     | fields=id,username,firstName,surname,organisationUnits[id,name],teiSearchOrganisationUnits[id,name],userRoles[id,name,authorities] | User object with assigned org units   |
| 2    | `/api/tracker/events`                         | GET    | Count **today's new cases** (Program 1)          | program=PrgCaseMgt1, programStage=PsInvestig1, orgUnitMode=ACCESSIBLE, occurredAfter={todayStart}, occurredBefore={todayEnd}, pageSize=1, totalPages=true | `pager.total` as count                |
| 3    | `/api/tracker/events`                         | GET    | Count **this month's new cases** (Program 1)     | program=PrgCaseMgt1, programStage=PsInvestig1, orgUnitMode=ACCESSIBLE, occurredAfter={monthStart}, pageSize=1, totalPages=true | `pager.total` as count                |
| 4    | `/api/tracker/events`                         | GET    | Count **pending verification cases**             | program=PrgCaseMgt1, programStage=PsInvestig1, orgUnitMode=ACCESSIBLE, filter=DeCaseStat1:eq:NEW, pageSize=1, totalPages=true | `pager.total` as count                |
| 5    | `/api/tracker/events`                         | GET    | Count **cases in progress**                      | program=PrgCaseMgt1, programStage=PsInvestig1, orgUnitMode=ACCESSIBLE, filter=DeCaseStat1:eq:IN_PROGRESS, pageSize=1, totalPages=true | `pager.total` as count                |
| 6    | `/api/tracker/events`                         | GET    | Retrieve **pending verification case list**      | program=PrgCaseMgt1, programStage=PsInvestig1, orgUnitMode=ACCESSIBLE, filter=DeCaseStat1:eq:NEW, fields=event,trackedEntity,enrollment,occurredAt, pageSize=10, order=occurredAt:desc | Events with trackedEntity references  |
| 7    | `/api/tracker/trackedEntities`                | GET    | Batch retrieve **case details for pending list** | trackedEntity={UID1,UID2,...}, program=PrgCaseMgt1, fields=trackedEntity,attributes[attribute,value,displayName],enrollments[enrollment,enrolledAt] | TrackedEntities with attributes       |
| 8    | `/api/tracker/events`                         | GET    | Count **pending test confirmations**             | program=PrgCaseMgt1, programStage=PsTest00001, orgUnitMode=ACCESSIBLE, filter=DeTestStat1:eq:PENDING_CONFIRMATION, pageSize=1, totalPages=true | `pager.total` as count                |
| 9    | `/api/tracker/events`                         | GET    | Retrieve **pending test list**                   | program=PrgCaseMgt1, programStage=PsTest00001, orgUnitMode=ACCESSIBLE, filter=DeTestStat1:eq:PENDING_CONFIRMATION, fields=event,enrollment,trackedEntity,dataValues[dataElement,value], pageSize=5, order=updatedAt:desc | Events with test data                 |
| 10   | `/api/tracker/events`                         | GET    | Count **today's unknown disease cases**          | program=PrgUnknown1, programStage=PsRegister1, orgUnitMode=ACCESSIBLE, occurredAfter={todayStart}, occurredBefore={todayEnd}, pageSize=1, totalPages=true | `pager.total` as count                |
| 11   | `/api/tracker/events`                         | GET    | Count **this month's unknown disease cases**     | program=PrgUnknown1, programStage=PsRegister1, orgUnitMode=ACCESSIBLE, occurredAfter={monthStart}, pageSize=1, totalPages=true | `pager.total` as count                |
| 12   | `/api/tracker/events`                         | GET    | Count **this month's alerts** (预留接口)         | program={AlertProgram}, orgUnitMode=ACCESSIBLE, occurredAfter={monthStart}, pageSize=1, totalPages=true | `pager.total` as count (future use)   |
| 13   | `/api/dataStore/userActivity/recent-{userId}` | GET    | Retrieve **recent access records**               | N/A                                                          | JSON array of recent case/event IDs   |
| 14   | `/api/organisationUnits/{ouId}`               | GET    | Get org unit details for display                 | fields=id,name,level                                         | OrganisationUnit object               |
| 15   | `/api/optionSets/OsDiseasCd1`                 | GET    | Get **disease code options** (for case display)  | fields=options[code,name]                                    | OptionSet with disease options        |
| 16   | `/api/optionSets/OsUnkStat01`                 | GET    | Get **unknown case status options**              | fields=options[code,name]                                    | OptionSet with unknown disease status |
| 17   | `/api/tracker/events`                         | GET    | Count **last month's new cases** (for trend)     | program=PrgCaseMgt1, programStage=PsInvestig1, orgUnitMode=ACCESSIBLE, occurredAfter={lastMonthStart}, occurredBefore={lastMonthEnd}, pageSize=1, totalPages=true | `pager.total` for comparison          |
| 18   | `/api/tracker/events`                         | GET    | Count **yesterday's new cases** (for trend)      | program=PrgCaseMgt1, programStage=PsInvestig1, orgUnitMode=ACCESSIBLE, occurredAfter={yesterdayStart}, occurredBefore={yesterdayEnd}, pageSize=1, totalPages=true | `pager.total` for daily trend         |

------

## 3. Notes

### 3.1 API Dependencies

```
API-01 (Get User Info)
  ↓
[Parallel Execution Group 1: Statistics]
├─ API-02 (Today's cases)
├─ API-03 (Month's cases) 
├─ API-04 (Pending verification)
├─ API-05 (In progress)
├─ API-08 (Pending tests)
├─ API-10 (Today's unknown)
├─ API-11 (Month's unknown)
├─ API-17 (Last month for trend)
└─ API-18 (Yesterday for trend)
  ↓
[Sequential Execution Group 2: Detail Lists]
API-06 (Pending case events) 
  ↓
API-07 (Batch get TrackedEntity details)
  ↓
API-09 (Pending test events)
  ↓
[Parallel Execution Group 3: Metadata & User Data]
├─ API-13 (Recent access - optional)
├─ API-14 (Org unit details)
├─ API-15 (Disease codes)
└─ API-16 (Unknown status codes)
```

### 3.2 Key Parameters

#### 3.2.1 Date Range Calculation

**Today's Range**:

```javascript
const todayStart = new Date().setHours(0,0,0,0);  // "2024-11-02T00:00:00.000Z"
const todayEnd = new Date().setHours(23,59,59,999); // "2024-11-02T23:59:59.999Z"
```

**This Month's Range**:

```javascript
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
// "2024-11-01T00:00:00.000Z"
```

**Last Month's Range** (for trend comparison):

```javascript
const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth()-1, 1);
const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59);
```

#### 3.2.2 DHIS2 Query Parameters

- **orgUnitMode=ACCESSIBLE**: Uses user's **search scope** (`teiSearchOrganisationUnits`). Do NOT combine with explicit `orgUnits` parameter
- **filter=DeCaseStat1:eq:NEW**: Filters by data element value (Data Element filters work in Events API)
- **pageSize=1 & totalPages=true**: For count-only queries (only `pager.total` is used)
- **occurredAfter / occurredBefore**: ISO-8601 datetime format, filters by Event's `occurredAt` field

### 3.3 Metadata Dependencies

#### Programs & Stages

| Metadata Type | ID          | Name             | Description                     |
| ------------- | ----------- | ---------------- | ------------------------------- |
| Program       | PrgCaseMgt1 | 已知疾病个案管理 | Confirmed disease case program  |
| ProgramStage  | PsInvestig1 | 个案调查         | Case investigation stage        |
| ProgramStage  | PsTest00001 | 检测记录         | Test record stage               |
| Program       | PrgUnknown1 | 不明原因疾病管理 | Unknown disease program         |
| ProgramStage  | PsRegister1 | 不明病例登记     | Unknown case registration stage |

#### Data Elements

| ID          | Name         | Description         | Stage Used  |
| ----------- | ------------ | ------------------- | ----------- |
| DeCaseStat1 | 个案状态     | Case status         | PsInvestig1 |
| DeTestStat1 | 检测状态     | Test status         | PsTest00001 |
| DeUnkStat01 | 不明病例状态 | Unknown case status | PsRegister1 |

#### Option Sets

| ID          | Name         | Options                                    |
| ----------- | ------------ | ------------------------------------------ |
| OsDiseasCd1 | 疾病编码     | A01:鼠疫, A02:霍乱, B03:新冠肺炎 etc.      |
| OsCaseStat1 | 个案状态     | NEW, VERIFIED, IN_PROGRESS, CLOSED         |
| OsUnkStat01 | 不明病例状态 | PENDING_TEST, TESTING, CONFIRMED, EXCLUDED |

### 3.4 Performance Considerations

#### Caching Strategy

| API Type            | Cache Duration | Invalidation Trigger  |
| ------------------- | -------------- | --------------------- |
| `/api/me`           | Session        | User logout           |
| `/api/optionSets/*` | 1 hour         | Metadata update       |
| Statistics APIs     | 5 minutes      | New data import       |
| Detail lists        | No cache       | Real-time requirement |

#### Optimization Tips

1. **Parallel Execution**: Execute all statistics APIs (API-02 to API-11, API-17, API-18) in parallel
2. **Batch Processing**: API-07 supports comma-separated UIDs (max 50 per request)
3. **Field Selection**: Only request needed fields to reduce payload size
4. **Pagination**: Use `pageSize=1` for count-only queries

### 3.5 Error Handling

| Error Code | Description                        | Fallback Strategy                                |
| ---------- | ---------------------------------- | ------------------------------------------------ |
| 403        | Permission denied                  | Show "无权限访问" message                        |
| 404        | Metadata not found                 | Check metadata UIDs in deployment                |
| E1003      | Invalid filter parameter           | Verify Data Element ID in ProgramStage           |
| Timeout    | API response > 10s                 | Show loading indicator, retry once               |
| Empty      | orgUnitMode=ACCESSIBLE returns [ ] | Fallback to orgUnitMode=CAPTURE or show "无数据" |

### 3.6 Trend Calculation Logic

**Month-over-Month Growth**:

```javascript
const thisMonth = API-03 result (pager.total)
const lastMonth = API-17 result (pager.total)
const growth = lastMonth === 0 ? 0 : ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)
// Display: "↑15%" or "↓5%" or "0%"
```

**Day-over-Day Growth** (for today's cases):

```javascript
const today = API-02 result (pager.total)
const yesterday = API-18 result (pager.total)
const growth = yesterday === 0 ? 0 : ((today - yesterday) / yesterday * 100).toFixed(1)
```

------

## 4. Example Request & Response

### API-01: Get Current User Information

**Request:**

```http
GET /api/me?fields=id,username,firstName,surname,organisationUnits[id,name,level],teiSearchOrganisationUnits[id,name],userRoles[id,name,authorities]
```

**Response:**

```json
{
  "id": "xE7jOejl9FI",
  "username": "chengdu_cdc_001",
  "firstName": "李",
  "surname": "娜",
  "organisationUnits": [
    {
      "id": "OuChengdu01",
      "name": "成都市",
      "level": 2
    }
  ],
  "teiSearchOrganisationUnits": [
    {
      "id": "OuChengdu01",
      "name": "成都市"
    },
    {
      "id": "OuWuhou0001",
      "name": "武侯区"
    }
  ],
  "userRoles": [
    {
      "id": "UrCityStf01",
      "name": "市级疾控业务人员",
      "authorities": [
        "F_TRACKED_ENTITY_INSTANCE_SEARCH",
        "F_PROGRAM_ENROLLMENT",
        "F_VIEW_EVENT_ANALYTICS"
      ]
    }
  ]
}
```

------

### API-02: Count Today's New Cases

**Request:**

```http
GET /api/tracker/events?program=PrgCaseMgt1&programStage=PsInvestig1&orgUnitMode=ACCESSIBLE&occurredAfter=2024-11-02T00:00:00.000Z&occurredBefore=2024-11-02T23:59:59.999Z&pageSize=1&totalPages=true
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 23
  },
  "events": []
}
```

> **Usage**: Display "23" in "今日新增个案" metric card.

------

### API-03: Count This Month's New Cases

**Request:**

```http
GET /api/tracker/events?program=PrgCaseMgt1&programStage=PsInvestig1&orgUnitMode=ACCESSIBLE&occurredAfter=2024-11-01T00:00:00.000Z&pageSize=1&totalPages=true
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 156
  },
  "events": []
}
```

> **Usage**: Display "156" in "本月新增个案" card. Combine with API-17 result to calculate "↑15%" trend.

------

### API-04: Count Pending Verification Cases

**Request:**

```http
GET /api/tracker/events?program=PrgCaseMgt1&programStage=PsInvestig1&orgUnitMode=ACCESSIBLE&filter=DeCaseStat1:eq:NEW&pageSize=1&totalPages=true
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 3
  },
  "events": []
}
```

> **Usage**: Display "3" in "待核实个案" card with "[查看]" link.

------

### API-06: Retrieve Pending Verification Case Events

**Request:**

```http
GET /api/tracker/events?program=PrgCaseMgt1&programStage=PsInvestig1&orgUnitMode=ACCESSIBLE&filter=DeCaseStat1:eq:NEW&fields=event,trackedEntity,enrollment,occurredAt&pageSize=10&order=occurredAt:desc
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 10,
    "total": 3
  },
  "events": [
    {
      "event": "ZwwuwNp6gVd",
      "trackedEntity": "Kj6vYde4LHh",
      "enrollment": "MNWZ6hnuhSw",
      "occurredAt": "2024-01-15T08:30:00.000"
    },
    {
      "event": "XwwuwNp6gVE",
      "trackedEntity": "Gjaiu3ea38E",
      "enrollment": "RtySG82BKE6",
      "occurredAt": "2024-01-15T09:00:00.000"
    },
    {
      "event": "YxxuxNp7gVF",
      "trackedEntity": "LzkvYde5MIi",
      "enrollment": "SuzTH93CLE7",
      "occurredAt": "2024-01-14T14:20:00.000"
    }
  ]
}
```

> **Next Step**: Extract `trackedEntity` UIDs → `["Kj6vYde4LHh", "Gjaiu3ea38E", "LzkvYde5MIi"]` → Pass to API-07

------

### API-07: Batch Retrieve TrackedEntity Details

**Request:**

```http
GET /api/tracker/trackedEntities?trackedEntity=Kj6vYde4LHh,Gjaiu3ea38E,LzkvYde5MIi&program=PrgCaseMgt1&fields=trackedEntity,attributes[attribute,value,displayName],enrollments[enrollment,enrolledAt]
```

**Response:**

```json
{
  "trackedEntities": [
    {
      "trackedEntity": "Kj6vYde4LHh",
      "attributes": [
        {
          "attribute": "AtrFullNm01",
          "displayName": "姓名",
          "value": "李四"
        },
        {
          "attribute": "AtrDiseaCd1",
          "displayName": "疾病编码",
          "value": "B03"
        }
      ],
      "enrollments": [
        {
          "enrollment": "MNWZ6hnuhSw",
          "enrolledAt": "2024-01-15T08:30:00.000"
        }
      ]
    },
    {
      "trackedEntity": "Gjaiu3ea38E",
      "attributes": [
        {
          "attribute": "AtrFullNm01",
          "displayName": "姓名",
          "value": "王五"
        },
        {
          "attribute": "AtrDiseaCd1",
          "displayName": "疾病编码",
          "value": "A02"
        }
      ],
      "enrollments": [
        {
          "enrollment": "RtySG82BKE6",
          "enrolledAt": "2024-01-15T09:00:00.000"
        }
      ]
    }
  ]
}
```

> **Usage**: Combine with API-06 results to display:
>
> ```
> ☐ 待核实个案 (3)
>   ├ CAS-2024-156 | 李四 | 新冠肺炎 | 2024-01-15
>   ├ CAS-2024-155 | 王五 | 霍乱     | 2024-01-15
>   └ CAS-2024-154 | 赵六 | 鼠疫     | 2024-01-14
> ```

------

### API-10: Count Today's Unknown Disease Cases

**Request:**

```http
GET /api/tracker/events?program=PrgUnknown1&programStage=PsRegister1&orgUnitMode=ACCESSIBLE&occurredAfter=2024-11-02T00:00:00.000Z&occurredBefore=2024-11-02T23:59:59.999Z&pageSize=1&totalPages=true
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 5
  },
  "events": []
}
```

> **Usage**: Display "5" in "今日不明原因病例" metric card (new requirement).

------

### API-11: Count This Month's Unknown Disease Cases

**Request:**

```http
GET /api/tracker/events?program=PrgUnknown1&programStage=PsRegister1&orgUnitMode=ACCESSIBLE&occurredAfter=2024-11-01T00:00:00.000Z&pageSize=1&totalPages=true
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 23
  },
  "events": []
}
```

> **Usage**: Display "23" in "本月不明原因病例" card.

------

### API-15: Get Disease Code Options

**Request:**

```http
GET /api/optionSets/OsDiseasCd1?fields=options[code,name]
```

**Response:**

```json
{
  "options": [
    { "code": "B03", "name": "新型冠状病毒肺炎(COVID-19)" },
    { "code": "A01", "name": "鼠疫" },
    { "code": "A02", "name": "霍乱" },
    { "code": "A03", "name": "黄热病" }
  ]
}
```

> **Usage**: Map disease codes to display names:
>
> - "B03" → "新冠肺炎"
> - "A02" → "霍乱"

------

### API-17: Count Last Month's Cases (for Trend)

**Request:**

```http
GET /api/tracker/events?program=PrgCaseMgt1&programStage=PsInvestig1&orgUnitMode=ACCESSIBLE&occurredAfter=2024-10-01T00:00:00.000Z&occurredBefore=2024-10-31T23:59:59.999Z&pageSize=1&totalPages=true
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 135
  },
  "events": []
}
```

> **Usage**: Calculate month-over-month trend:
>
> ```javascript
> const growth = ((156 - 135) / 135 * 100).toFixed(1); // "15.6%"
> // Display: "↑15%" in "本月新增个案" card
> ```

------

## 5. Additional Considerations

### 5.1 Dashboard Layout Mapping

| UI Card          | API(s) Used | Display Logic                                  |
| ---------------- | ----------- | ---------------------------------------------- |
| 今日新增个案     | API-02, 18  | `API-02 total` with trend from `API-18`        |
| 本月新增个案     | API-03, 17  | `API-03 total` with trend "↑15%" from `API-17` |
| 待核实个案       | API-04      | `API-04 total` with "[查看]" button            |
| 处理中个案       | API-05      | `API-05 total` with "[查看]" button            |
| 今日不明原因病例 | API-10      | `API-10 total`                                 |
| 本月不明原因病例 | API-11      | `API-11 total`                                 |
| 本月预警事件     | API-12      | `API-12 total` (future implementation)         |

### 5.2 Real-time Updates

**Polling Strategy**:

- Statistics APIs (API-02 to API-11): Poll every **60 seconds**
- Detail lists (API-06, API-09): Poll every **30 seconds**
- Metadata (API-15, API-16): No polling (cached 1 hour)

**WebSocket Alternative** (future enhancement):

- Subscribe to `/topic/newCases` for push notifications
- Requires DHIS2 messaging extension or custom middleware

### 5.3 Accessibility Compliance

- **Metric Cards**: Add `aria-label="本月新增个案156例，较上月增长15%"`
- **Pending Lists**: Use `role="list"` and `aria-live="polite"` for dynamic updates
- **Trend Indicators**: Include `aria-hidden="true"` on ↑/↓ symbols, describe in `aria-label`

### 5.4 Mobile Responsiveness

For mobile view (WF-4.9):

- **Metric Cards**: 2-column grid on mobile (4 cards visible, scroll for more)
- **Pending Lists**: Collapse to show only count + "[查看全部]" button
- **Quick Actions**: Fixed bottom nav bar (5 icons)

------

## 6. Testing Checklist

- [ ] Verify `teiSearchOrganisationUnits` is not empty in API-01 response
- [ ] Confirm Data Element `DeCaseStat1` exists in ProgramStage `PsInvestig1`
- [ ] Test with **zero results** scenario (e.g., new deployment with no data)
- [ ] Test with **large dataset** (>1000 cases) to verify pagination performance
- [ ] Validate date range calculations across time zones (use UTC consistently)
- [ ] Test permission scenarios:
  - User with only **Capture** scope (no search scope)
  - User with **Read-only** access (cannot modify cases)
  - User with **Super User** authority (should see orgUnitMode=ALL option)
- [ ] Verify trend calculation handles division by zero (last month = 0 cases)
- [ ] Test error handling for timeout, 403, 404 responses

------

## 7. Migration from Old API Contract

**Breaking Changes**:

1. **API-02 to API-05**: Changed from `/api/tracker/trackedEntities` to `/api/tracker/events` (filter on Data Element now works)
2. **API-06 + API-07**: Split into 2-step process (get events → get TrackedEntity details)
3. **New APIs**: API-10, API-11, API-17, API-18 (unknown disease cases + trend calculation)

**Backward Compatibility**:

- Metadata UIDs remain unchanged
- User permission model unchanged
- DataStore structure unchanged (API-13)

------

**Document Version**: 2.0 (Revised 2025-11-02)
