# API Contract 1 – Dashboard Page (WF-4.1)

## 1. Page Description

The Dashboard (工作台) serves as the landing page, providing an overview of key metrics, pending tasks, recent activity, and quick access to common functions. It displays: (1) Key indicator cards showing counts and trends for current month cases, pending verification cases, in-progress cases, and current month alerts; (2) To-do list grouped by priority (pending verification cases, pending test confirmations, pending alerts); (3) Recent access history; (4) Quick entry shortcuts for creating new cases/unknown cases and viewing statistics. Data is aggregated from Programs 1, 2, and the Alert system.

## 2. Required DHIS2 APIs

| #    | Endpoint                                      | Method   | Description                                                  | Key Parameters                                               | Expected Response / Data Type               |
| ---- | --------------------------------------------- | -------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------- |
| 1    | `/api/me`                                     | GET      | Get current user context (org units, authorities, display name) | `fields=id,username,displayName,organisationUnits[id,name,level],dataViewOrganisationUnits[id],authorities` | User object                                 |
| 2    | `/api/tracker/trackedEntities`                | GET      | Count new cases this month (Program 1)                       | `program=PrgCaseMgt1&orgUnits={userOuId}&orgUnitMode=CAPTURE&enrollmentEnrolledAfter={monthStart}&enrollmentEnrolledBefore={monthEnd}&fields=none&pageSize=1&totalPages=true` | Pager with total count                      |
| 3    | `/api/tracker/trackedEntities`                | GET      | Count cases from previous month for trend comparison         | `program=PrgCaseMgt1&orgUnits={userOuId}&orgUnitMode=CAPTURE&enrollmentEnrolledAfter={prevMonthStart}&enrollmentEnrolledBefore={prevMonthEnd}&fields=none&pageSize=1&totalPages=true` | Pager with total count                      |
| 4    | `/api/tracker/events`                         | GET      | Count pending verification cases (Stage 1 Investigation with status=NEW) | `program=PrgCaseMgt1&orgUnit={userOuId}&orgUnitMode=CAPTURE&programStage=PsInvestig1&filter=DeCaseStat1:eq:OptNew00001&fields=event&pageSize=50` | { pager, events[] } for display list        |
| 5    | `/api/tracker/events`                         | GET      | Count in-progress cases (Stage 1 Investigation with status=IN_PROGRESS) | `program=PrgCaseMgt1&orgUnit={userOuId}&orgUnitMode=CAPTURE&programStage=PsInvestig1&filter=DeCaseStat1:eq:OptInProg10&fields=event,enrollment,dataValues[dataElement,value]&pageSize=50` | { pager, events[] }                         |
| 6    | `/api/tracker/trackedEntities`                | GET      | Count current month alerts                                   | `trackedEntityType=TetAlertEvt&program=PrgAlertMgt&orgUnits={userOuId}&orgUnitMode=ACCESSIBLE&enrollmentEnrolledAfter={monthStart}&fields=none&pageSize=1&totalPages=true` | Pager with total count                      |
| 7    | `/api/tracker/trackedEntities`                | GET      | Count pending alerts (status=PENDING or IN_PROGRESS)         | `trackedEntityType=TetAlertEvt&program=PrgAlertMgt&orgUnits={userOuId}&orgUnitMode=ACCESSIBLE&filter=AtrAlertSts:in:[PENDING,IN_PROGRESS]&fields=trackedEntity,attributes[attribute,value]&pageSize=50` | { pager, trackedEntities[] } for to-do list |
| 8    | `/api/tracker/events`                         | GET      | List pending test confirmations (Stage 4 Test Records with status=PENDING_CONFIRMATION) | `program=PrgCaseMgt1&orgUnit={userOuId}&orgUnitMode=CAPTURE&programStage=PsTest00001&filter=DeTestStat1:eq:OptPendCnf1&fields=event,enrollment,trackedEntity,occurredAt,dataValues[dataElement,value]&order=occurredAt:desc&pageSize=50` | { pager, events[] }                         |
| 9    | `/api/dataStore/userActivity/recent-{userId}` | GET      | Fetch user's recent access history (last 10 items)           | N/A                                                          | { items: [{type, uid, name, timestamp}] }   |
| 10   | `/api/dataStore/userActivity/recent-{userId}` | POST/PUT | Store user's access history when navigating to detail pages  | Recent activity item object                                  | Success response                            |
| 11   | `/api/analytics`                              | GET      | Get aggregated case count trend (monthly time series for chart) | `dimension=pe:LAST_12_MONTHS;dx:{indicatorId};ou:{userOuId}&displayProperty=NAME` | Analytics response with data values         |
| 12   | `/api/indicators`                             | GET      | Load indicator definitions for dashboard metrics             | `filter=name:ilike:case&fields=id,name,numerator,denominator` | Indicator list                              |
| 13   | `/api/organisationUnits/{ouId}`               | GET      | Get org unit hierarchy path for breadcrumb display           | `fields=id,name,level,path,parent[id,name]`                  | OrganisationUnit object                     |
| 14   | `/api/tracker/trackedEntities`                | GET      | Fetch pending verification case details for to-do list       | `trackedEntity={teiUid}&program=PrgCaseMgt1&fields=trackedEntity,attributes[attribute,value],enrollments[enrollment,enrolledAt]` | TrackedEntity object                        |
| 15   | `/api/programs`                               | GET      | Load Program 1 and 2 metadata for quick entry validation     | `filter=id:in:[PrgCaseMgt1,PrgUnknown1]&fields=id,name,access[data[write]]` | Program list                                |

## 3. Notes

### Indicator Cards (关键指标概览)

**Card 1: 本月新增个案 (New Cases This Month)**

- **Primary data**: API-2 (current month count)
- **Trend calculation**: `((currentMonth - previousMonth) / previousMonth) * 100`
- **API-3** provides previous month count for trend
- Display: `156` with trend indicator `↑15%` in green (increase) or red (decrease based on context)

**Card 2: 待核实个案 (Pending Verification Cases)**

- **Primary data**: API-4 count
- Use filter: `DeCaseStat1:eq:OptNew00001` (Status=新建)
- Display count with [查看] button linking to Case List with pre-applied filter
- Badge color: Yellow/Warning

**Card 3: 处理中个案 (In-Progress Cases)**

- **Primary data**: API-5 count
- Use filter: `DeCaseStat1:eq:OptInProg10` (Status=处理中)
- Display count with [查看] button
- Badge color: Blue/Info

**Card 4: 本月预警事件 (Current Month Alerts)**

- **Primary data**: API-6 count
- Use filter: Enrollment date within current month
- Display count with [处理] button linking to Alert List
- Badge color: Red if any PENDING alerts exist, otherwise Gray

### To-Do List (待办事项)

**Section 1: 待核实个案 (Pending Verification - Priority P0)**

- **Data source**: API-4 results (up to 3 items shown, expandable)

- Display format:

  ```
  ☐ CAS-2024-156 | 李四 | 新冠肺炎 | 2024-01-15
  ```

- Clicking item navigates to Case Details (WF-4.3)

- Show "查看全部 X 条" link if count > 3

**Section 2: 待确认检测 (Pending Test Confirmations - Priority P0)**

- **Data source**: API-8 results (up to 5 items shown)

- Display format:

  ```
  ☐ TEST-2024-089 | CAS-2024-150 | 核酸检测
  ```

- Clicking item navigates to Case Details Test Records tab

- Filter: `DeTestStat1:eq:OptPendCnf1` (Test Status=待确认)

**Section 3: 待处理预警 (Pending Alerts - Priority P0)**

- **Data source**: API-7 results (up to 2 items shown)

- Display format:

  ```
  ☐ ALT-2024-012 | 病例聚集 | 北京市 | 高风险
  ```

- Clicking item navigates to Alert Details

- Filter: `AtrAlertSts:in:[PENDING,IN_PROGRESS]`

### Recent Access (最近访问 - Priority P1)

- **Data source**: API-9 (DataStore-based user activity log)

- DataStore namespace: `userActivity`

- DataStore key format: `recent-{userId}` (e.g., `recent-UserChgd001`)

- JSON structure:

  ```json
  {  "items": [    {"type": "CASE", "uid": "CAS-2024-156", "name": "张三", "timestamp": "2024-01-15T14:30:00Z"},    {"type": "UNKNOWN_CASE", "uid": "UNK-2024-021", "name": "王五", "timestamp": "2024-01-15T10:00:00Z"},    {"type": "ALERT", "uid": "ALT-2024-012", "name": "病例聚集预警", "timestamp": "2024-01-14T16:00:00Z"}  ]}
  ```

- Store activity via API-10 when user accesses detail pages

- Display last 4 items in dashboard

- Clicking item navigates to corresponding detail page

### Quick Entry (快捷入口 - Priority P1)

- **Data source**: API-15 (check user write access to programs)
- Buttons:
  - `[➕ 新增个案]` → Navigate to New Case Form (WF-4.4) if `PrgCaseMgt1.access.data.write=true`
  - `[➕ 新增不明病例]` → Navigate to New Unknown Case Form if `PrgUnknown1.access.data.write=true`
  - `[📊 疾病统计]` → Navigate to Statistical Analysis (WF-4.8)
  - `[📥 导出报告]` → Trigger report export dialog (not covered in this contract)
- Disable buttons if user lacks write access

### Date Range Calculations

All date filters use current user's timezone from API-1.

```javascript
// Current month range
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

// Previous month range (for trend)
const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
```

### Organisation Unit Scope

- Use `orgUnitMode=CAPTURE` for case-related queries (APIs 2-5, 8)
- Use `orgUnitMode=ACCESSIBLE` for alert queries (APIs 6-7) since alerts may have `accessLevel=AUDITED`
- `{userOuId}` obtained from API-1 `organisationUnits[0].id` (user's primary org unit)

### Performance Optimization

- **Parallel API calls**: APIs 2-8 can be executed in parallel for faster page load

- Caching

  :

  - Cache API-1 (user context) for session duration
  - Cache API-15 (program metadata) for 5 minutes
  - Do not cache count APIs (2-8) to ensure real-time data

- Pagination

  :

  - For to-do lists, fetch `pageSize=50` initially
  - Use `fields=none` for count-only queries (APIs 2, 3, 6) to minimize response size
  - Use minimal `fields` for list items (only display-relevant fields)

### Error Handling

- If any indicator card API fails, display `--` with error icon
- If to-do list API fails, show empty state with retry button
- If recent access API fails (DataStore not configured), hide section gracefully

### Access Control

- All queries respect user's org unit scope (capture/accessible)
- To-do items only show data user has read access to (sharing + ownership)
- Quick entry buttons respect program write permissions

## 4. Example Request & Response

### API-01: Get Current User Context

**请求:**

```http
GET /api/me?fields=id,username,displayName,organisationUnits[id,name,level],dataViewOrganisationUnits[id],authorities
```

**响应:**

```json
{
  "id": "UserChgd001",
  "username": "chengdu_cdc_001",
  "displayName": "李娜",
  "organisationUnits": [
    {
      "id": "OuChengdu01",
      "name": "成都市疾控中心",
      "level": 2
    }
  ],
  "dataViewOrganisationUnits": [
    {"id": "OuChengdu01"}
  ],
  "authorities": [
    "F_TRACKED_ENTITY_INSTANCE_SEARCH",
    "F_TRACKED_ENTITY_INSTANCE_ADD",
    "F_PROGRAM_ENROLLMENT"
  ]
}
```

### API-02: Count New Cases This Month

**请求:**

```http
GET /api/tracker/trackedEntities?program=PrgCaseMgt1&orgUnits=OuChengdu01&orgUnitMode=CAPTURE&enrollmentEnrolledAfter=2024-01-01T00:00:00.000&enrollmentEnrolledBefore=2024-01-31T23:59:59.999&fields=none&pageSize=1&totalPages=true
```

**响应:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 156,
    "pageCount": 156
  }
}
```

### API-03: Count Cases Previous Month (for Trend)

**请求:**

```http
GET /api/tracker/trackedEntities?program=PrgCaseMgt1&orgUnits=OuChengdu01&orgUnitMode=CAPTURE&enrollmentEnrolledAfter=2023-12-01T00:00:00.000&enrollmentEnrolledBefore=2023-12-31T23:59:59.999&fields=none&pageSize=1&totalPages=true
```

**响应:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 1,
    "total": 135,
    "pageCount": 135
  }
}
```

**Trend calculation:** `((156 - 135) / 135) * 100 = 15.56%` → Display as `↑15%`

### API-04: List Pending Verification Cases (To-Do Item)

**请求:**

```http
GET /api/tracker/events?program=PrgCaseMgt1&orgUnit=OuChengdu01&orgUnitMode=CAPTURE&programStage=PsInvestig1&filter=DeCaseStat1:eq:OptNew00001&fields=event,enrollment,trackedEntity,occurredAt,dataValues[dataElement,value]&order=occurredAt:desc&pageSize=3
```

**响应:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 3,
    "total": 3
  },
  "events": [
    {
      "event": "evtInv156",
      "enrollment": "enr156",
      "trackedEntity": "Kj6vYde4LHh",
      "occurredAt": "2024-01-15T14:30:00.000",
      "dataValues": [
        {"dataElement": "DeCaseStat1", "value": "OptNew00001"}
      ]
    },
    {
      "event": "evtInv155",
      "enrollment": "enr155",
      "trackedEntity": "PQfMcpmXeFE",
      "occurredAt": "2024-01-15T10:45:00.000",
      "dataValues": [
        {"dataElement": "DeCaseStat1", "value": "OptNew00001"}
      ]
    },
    {
      "event": "evtInv154",
      "enrollment": "enr154",
      "trackedEntity": "Gjaiu3ea38E",
      "occurredAt": "2024-01-14T16:20:00.000",
      "dataValues": [
        {"dataElement": "DeCaseStat1", "value": "OptNew00001"}
      ]
    }
  ]
}
```

**Note:** To display case number and patient name, need to fetch TEI details via API-14:

### API-14: Fetch TEI Details for To-Do List Display

**请求:**

```http
GET /api/tracker/trackedEntities/Kj6vYde4LHh?program=PrgCaseMgt1&fields=trackedEntity,attributes[attribute,value],enrollments[enrollment,enrolledAt]
```

**响应:**

```json
{
  "trackedEntity": "Kj6vYde4LHh",
  "attributes": [
    {"attribute": "AtrCaseNo01", "value": "CASE-20240115-0156"},
    {"attribute": "AtrFullNm01", "value": "李四"},
    {"attribute": "AtrDiseaCd1", "value": "OptDiseaB30"}
  ],
  "enrollments": [
    {
      "enrollment": "enr156",
      "enrolledAt": "2024-01-15T00:00:00.000"
    }
  ]
}
```

**Aggregated To-Do Display:**

```
☐ 待核实个案 (3)
  ├ CASE-20240115-0156 | 李四 | 新冠肺炎 | 2024-01-15
  ├ CASE-20240115-0155 | 王五 | 霍乱 | 2024-01-15
  └ CASE-20240114-0154 | 赵六 | 鼠疫 | 2024-01-14
```

### API-08: List Pending Test Confirmations

**请求:**

```http
GET /api/tracker/events?program=PrgCaseMgt1&orgUnit=OuChengdu01&orgUnitMode=CAPTURE&programStage=PsTest00001&filter=DeTestStat1:eq:OptPendCnf1&fields=event,enrollment,trackedEntity,occurredAt,dataValues[dataElement,value]&order=occurredAt:desc&pageSize=5
```

**响应:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 5,
    "total": 5
  },
  "events": [
    {
      "event": "evTest089",
      "enrollment": "enr150",
      "trackedEntity": "tei150",
      "occurredAt": "2024-01-15T09:00:00.000",
      "dataValues": [
        {"dataElement": "DeTestNo001", "value": "TEST-2024-089"},
        {"dataElement": "DeTestType1", "value": "NAT"},
        {"dataElement": "DeTestStat1", "value": "OptPendCnf1"}
      ]
    },
    {
      "event": "evTest088",
      "enrollment": "enr149",
      "trackedEntity": "tei149",
      "occurredAt": "2024-01-14T16:30:00.000",
      "dataValues": [
        {"dataElement": "DeTestNo001", "value": "TEST-2024-088"},
        {"dataElement": "DeTestType1", "value": "ANTIBODY"},
        {"dataElement": "DeTestStat1", "value": "OptPendCnf1"}
      ]
    }
  ]
}
```

**Display format:**

```
☐ 待确认检测 (5)
  ├ TEST-2024-089 | CAS-2024-150 | 核酸检测
  └ TEST-2024-088 | CAS-2024-149 | 抗体检测
  └ [查看全部 5 条]
```

### API-07: List Pending Alerts

**请求:**

```http
GET /api/tracker/trackedEntities?trackedEntityType=TetAlertEvt&program=PrgAlertMgt&orgUnits=OuChengdu01&orgUnitMode=ACCESSIBLE&filter=AtrAlertSts:in:[PENDING,IN_PROGRESS]&fields=trackedEntity,attributes[attribute,value]&order=createdAt:desc&pageSize=2
```

**响应:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 2,
    "total": 2
  },
  "trackedEntities": [
    {
      "trackedEntity": "altTE012",
      "attributes": [
        {"attribute": "AtrAlertNo", "value": "ALT-2024-012"},
        {"attribute": "AtrAlertTyp", "value": "CASE_CLUSTER"},
        {"attribute": "AtrAlertRgn", "value": "OuChengdu01"},
        {"attribute": "AtrAlertLvl", "value": "LEVEL_1"},
        {"attribute": "AtrAlertSts", "value": "PENDING"}
      ]
    },
    {
      "trackedEntity": "altTE011",
      "attributes": [
        {"attribute": "AtrAlertNo", "value": "ALT-2024-011"},
        {"attribute": "AtrAlertTyp", "value": "ABNORMAL_SYMPTOM"},
        {"attribute": "AtrAlertRgn", "value": "OuMianyang1"},
        {"attribute": "AtrAlertLvl", "value": "LEVEL_2"},
        {"attribute": "AtrAlertSts", "value": "IN_PROGRESS"}
      ]
    }
  ]
}
```

**Display format:**

```
☐ 待处理预警 (2)
  ├ ALT-2024-012 | 病例聚集 | 北京市 | 高风险
  └ ALT-2024-011 | 异常症状 | 上海市 | 中风险
```

### API-09: Fetch Recent Access History

**请求:**

```http
GET /api/dataStore/userActivity/recent-UserChgd001
```

**响应:**

```json
{
  "items": [
    {
      "type": "CASE",
      "uid": "CASE-20240115-0156",
      "teiUid": "Kj6vYde4LHh",
      "name": "张三 (新冠肺炎)",
      "timestamp": "2024-01-15T14:30:00.000Z"
    },
    {
      "type": "CASE",
      "uid": "CASE-20240115-0150",
      "teiUid": "tei150",
      "name": "李明 (霍乱)",
      "timestamp": "2024-01-15T11:20:00.000Z"
    },
    {
      "type": "ALERT",
      "uid": "ALT-2024-012",
      "teiUid": "altTE012",
      "name": "病例聚集预警",
      "timestamp": "2024-01-14T16:00:00.000Z"
    },
    {
      "type": "REPORT",
      "uid": "RPT-2024-STAT",
      "name": "疾病统计报表",
      "timestamp": "2024-01-14T10:00:00.000Z"
    }
  ]
}
```

**Display format:**

```
最近访问 (P1)
• CASE-20240115-0156 (张三)
• CASE-20240115-0150 (李明)
• ALT-2024-012 (病例聚集预警)
• 疾病统计报表
```

### API-10: Store Recent Access (When User Navigates to Case Details)

**请求:**

```http
PUT /api/dataStore/userActivity/recent-UserChgd001
Content-Type: application/json

{
  "items": [
    {
      "type": "CASE",
      "uid": "CASE-20240115-0157",
      "teiUid": "newTeiUid",
      "name": "新病例 (新冠肺炎)",
      "timestamp": "2024-01-15T15:00:00.000Z"
    },
    {
      "type": "CASE",
      "uid": "CASE-20240115-0156",
      "teiUid": "Kj6vYde4LHh",
      "name": "张三 (新冠肺炎)",
      "timestamp": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

**响应:**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "message": "Key 'recent-UserChgd001' updated."
}
```

**Note:** Limit to last 10 items; older items are dropped. Implement client-side deduplication.

### API-15: Check Program Write Access for Quick Entry Buttons

**请求:**

```http
GET /api/programs?filter=id:in:[PrgCaseMgt1,PrgUnknown1]&fields=id,name,access[data[write]]
```

**响应:**

```json
{
  "programs": [
    {
      "id": "PrgCaseMgt1",
      "name": "已知疾病个案管理",
      "access": {
        "data": {
          "write": true
        }
      }
    },
    {
      "id": "PrgUnknown1",
      "name": "不明原因疾病管理",
      "access": {
        "data": {
          "write": false
        }
      }
    }
  ]
}
```

**UI Logic:**

- "新增个案" button: **Enabled** (PrgCaseMgt1.access.data.write = true)
- "新增不明病例" button: **Disabled** with tooltip "无权限" (PrgUnknown1.access.data.write = false)

