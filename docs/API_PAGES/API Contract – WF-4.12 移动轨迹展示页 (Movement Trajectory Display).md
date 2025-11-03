# API Contract – WF-4.12 移动轨迹展示页 (Movement Trajectory Display)

## 1. Page Description

This page displays the geographical movement trajectory of a tracked entity (patient/case) over a specified time period. It visualizes tracking records on a map with waypoints, timestamps, duration of stay, and risk levels. Users can filter by case number, time range, and geographical area to analyze movement patterns for epidemiological investigation purposes.

------

## 2. Required DHIS2 APIs

| #    | Endpoint                             | Method | Description                                                 | Key Parameters                                               | Expected Response / Data Type       |
| ---- | ------------------------------------ | ------ | ----------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| 1    | `/api/tracker/trackedEntities/{uid}` | GET    | Retrieve tracked entity details including basic information | `fields=trackedEntity,trackedEntityType,attributes,enrollments[enrollment,program]` | TrackedEntity object                |
| 2    | `/api/tracker/events`                | GET    | Retrieve tracking records (events) for Stage 5: 追踪记录    | `enrollment={enrollmentUid}&programStage=PsTracking1&fields=*&order=occurredAt:asc` | Event collection with tracking data |
| 3    | `/api/programs/{uid}`                | GET    | Get program metadata to verify access                       | `fields=id,name,programStages[id,name]`                      | Program object                      |
| 4    | `/api/programStages/PsTracking1`     | GET    | Get tracking stage metadata including data elements         | `fields=id,name,programStageDataElements[dataElement[id,name,valueType]]` | ProgramStage object                 |
| 5    | `/api/organisationUnits`             | GET    | Get organization unit hierarchy for geographical filtering  | `filter=level:eq:2&filter=level:eq:3&fields=id,name,level,parent[id]&paging=false` | OrganisationUnit collection         |
| 6    | `/api/optionSets/OsTrackTp01`        | GET    | Get tracking type options                                   | `fields=id,name,options[code,name]`                          | OptionSet with tracking types       |
| 7    | `/api/optionSets/OsRiskAsmt1`        | GET    | Get risk assessment options                                 | `fields=id,name,options[code,name]`                          | OptionSet with risk levels          |

------

## 3. Notes

### 3.1 API Dependencies

- **API-01** must execute first to get the tracked entity's enrollment UID
- **API-02** depends on enrollment UID from API-01 and programStage UID "PsTracking1"
- **API-03** and **API-04** can load in parallel for metadata
- **API-05** loads independently for filter dropdowns
- **API-06** and **API-07** load option sets for data interpretation

### 3.2 Data Element Mapping

According to the design document, Stage 5 (追踪记录 - PsTracking1) contains:

- `DeTrackTp01` (追踪类型 - trackingType): OPTION_SET → OsTrackTp01
- `DeStartDt01` (起始日期 - startDate): DATE
- `DeEndDt0001` (结束日期 - endDate): DATE
- `DeLocDesc01` (地点描述 - locationDescription): LONG_TEXT
- `DeRelRgn001` (关联地区 - relatedRegion): ORGANISATION_UNIT
- `DeRiskAsmt1` (风险评估 - riskAssessment): OPTION_SET → OsRiskAsmt1
- Event-level `geometry` field (if present) for map coordinates

### 3.3 Query Filters

- **Time Range Filter**: Use `occurredAfter` and `occurredBefore` parameters on `/api/tracker/events`
- **Geographical Filter**: Use `orgUnit` parameter combined with `orgUnitMode=DESCENDANTS` for hierarchical filtering
- **Case Number Filter**: Use tracked entity UID directly in the initial query

### 3.4 Pagination

- For tracking records, set `paging=false` or use large `pageSize` if the expected number of tracking events per case is manageable (typically < 100)
- If pagination needed: `page=1&pageSize=50&totalPages=true`

### 3.5 Geometry Handling

- Tracking events may contain `geometry` field with GeoJSON format: `{"type":"Point","coordinates":[longitude,latitude]}`
- Alternative: Extract coordinates from `DeLocDesc01` if structured text format is used
- Coordinate validation: longitude range [-180, 180], latitude range [-90, 90]

### 3.6 Risk Level Color Coding

According to design document (OsRiskAsmt1):

- 高风险 (HIGH) → 🔴 Red
- 中风险 (MEDIUM) → 🟡 Yellow
- 低风险 (LOW) → 🟢 Green

### 3.7 Duration Calculation

- Duration = `endDate - startDate` (calculated client-side)
- Display format: "X天Y小时" or "X days Y hours"

------

## 4. Example Request & Response

### API-01: Get Tracked Entity with Enrollment

**Request:**

```http
GET /api/tracker/trackedEntities/PQfMcpmXeFE?fields=trackedEntity,trackedEntityType,attributes[attribute,value,displayName],enrollments[enrollment,program,enrolledAt,status]&program=PrgCaseMgt1
```

**Response:**

```json
{
  "trackedEntity": "PQfMcpmXeFE",
  "trackedEntityType": "nEenWmSyUEp",
  "attributes": [
    {
      "attribute": "w75KJ2mc4zz",
      "displayName": "姓名",
      "value": "张三"
    },
    {
      "attribute": "AtrCaseNo01",
      "displayName": "个案编号",
      "value": "CAS-2024-156"
    }
  ],
  "enrollments": [
    {
      "enrollment": "JMgRZyeLWOo",
      "program": "PrgCaseMgt1",
      "enrolledAt": "2024-01-10T00:00:00.000",
      "status": "ACTIVE"
    }
  ]
}
```

------

### API-02: Get Tracking Records (Events)

**Request:**

```http
GET /api/tracker/events?enrollment=JMgRZyeLWOo&programStage=PsTracking1&fields=event,occurredAt,geometry,dataValues[dataElement,value]&order=occurredAt:asc&occurredAfter=2024-01-01&occurredBefore=2024-01-31
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 50
  },
  "events": [
    {
      "event": "TrkEvt00001",
      "occurredAt": "2024-01-10T08:00:00.000",
      "geometry": {
        "type": "Point",
        "coordinates": [116.4074, 39.9042]
      },
      "dataValues": [
        {
          "dataElement": "DeTrackTp01",
          "value": "TRAVEL_HISTORY"
        },
        {
          "dataElement": "DeStartDt01",
          "value": "2024-01-10"
        },
        {
          "dataElement": "DeEndDt0001",
          "value": "2024-01-13"
        },
        {
          "dataElement": "DeLocDesc01",
          "value": "北京市朝阳区XX街道XX小区"
        },
        {
          "dataElement": "DeRelRgn001",
          "value": "OuChaoyang1"
        },
        {
          "dataElement": "DeRiskAsmt1",
          "value": "HIGH"
        }
      ]
    },
    {
      "event": "TrkEvt00002",
      "occurredAt": "2024-01-15T14:30:00.000",
      "geometry": {
        "type": "Point",
        "coordinates": [116.2980, 39.9645]
      },
      "dataValues": [
        {
          "dataElement": "DeTrackTp01",
          "value": "CONTACT_HISTORY"
        },
        {
          "dataElement": "DeStartDt01",
          "value": "2024-01-15"
        },
        {
          "dataElement": "DeEndDt0001",
          "value": "2024-01-17"
        },
        {
          "dataElement": "DeLocDesc01",
          "value": "北京市海淀区XX路XX号"
        },
        {
          "dataElement": "DeRelRgn001",
          "value": "OuHaidian1"
        },
        {
          "dataElement": "DeRiskAsmt1",
          "value": "MEDIUM"
        }
      ]
    }
  ]
}
```

------

### API-03: Get Program Metadata

**Request:**

```http
GET /api/programs/PrgCaseMgt1?fields=id,name,programStages[id,name]
```

**Response:**

```json
{
  "id": "PrgCaseMgt1",
  "name": "已知疾病个案管理",
  "programStages": [
    {
      "id": "PsInvestig1",
      "name": "个案调查"
    },
    {
      "id": "PsTracking1",
      "name": "追踪记录"
    }
  ]
}
```

------

### API-04: Get Tracking Stage Data Elements

**Request:**

```http
GET /api/programStages/PsTracking1?fields=id,name,programStageDataElements[dataElement[id,name,valueType,optionSet[id]]]
```

**Response:**

```json
{
  "id": "PsTracking1",
  "name": "追踪记录",
  "programStageDataElements": [
    {
      "dataElement": {
        "id": "DeTrackTp01",
        "name": "追踪类型",
        "valueType": "TEXT",
        "optionSet": {
          "id": "OsTrackTp01"
        }
      }
    },
    {
      "dataElement": {
        "id": "DeStartDt01",
        "name": "起始日期",
        "valueType": "DATE"
      }
    },
    {
      "dataElement": {
        "id": "DeEndDt0001",
        "name": "结束日期",
        "valueType": "DATE"
      }
    },
    {
      "dataElement": {
        "id": "DeLocDesc01",
        "name": "地点描述",
        "valueType": "LONG_TEXT"
      }
    },
    {
      "dataElement": {
        "id": "DeRelRgn001",
        "name": "关联地区",
        "valueType": "ORGANISATION_UNIT"
      }
    },
    {
      "dataElement": {
        "id": "DeRiskAsmt1",
        "name": "风险评估",
        "valueType": "TEXT",
        "optionSet": {
          "id": "OsRiskAsmt1"
        }
      }
    }
  ]
}
```

------

### API-05: Get Organisation Units for Filter

**Request:**

```http
GET /api/organisationUnits?filter=level:in:[2,3]&fields=id,name,level,parent[id,name]&paging=false
```

**Response:**

```json
{
  "organisationUnits": [
    {
      "id": "OuChengdu01",
      "name": "成都市",
      "level": 2,
      "parent": {
        "id": "OuSichuan10",
        "name": "四川省"
      }
    },
    {
      "id": "OuWuhou0001",
      "name": "武侯区",
      "level": 3,
      "parent": {
        "id": "OuChengdu01",
        "name": "成都市"
      }
    }
  ]
}
```

------

### API-06: Get Tracking Type Options

**Request:**

```http
GET /api/optionSets/OsTrackTp01?fields=id,name,options[code,name,sortOrder]
```

**Response:**

```json
{
  "id": "OsTrackTp01",
  "name": "追踪类型",
  "options": [
    {
      "code": "TRAVEL_HISTORY",
      "name": "旅居史",
      "sortOrder": 1
    },
    {
      "code": "CONTACT_HISTORY",
      "name": "接触史",
      "sortOrder": 2
    },
    {
      "code": "ITEM_EXPOSURE",
      "name": "物品暴露史",
      "sortOrder": 3
    },
    {
      "code": "PLACE_EXPOSURE",
      "name": "场所暴露史",
      "sortOrder": 4
    }
  ]
}
```

------

### API-07: Get Risk Assessment Options

**Request:**

```http
GET /api/optionSets/OsRiskAsmt1?fields=id,name,options[code,name,sortOrder]
```

**Response:**

```json
{
  "id": "OsRiskAsmt1",
  "name": "风险评估",
  "options": [
    {
      "code": "HIGH",
      "name": "高风险",
      "sortOrder": 1
    },
    {
      "code": "MEDIUM",
      "name": "中风险",
      "sortOrder": 2
    },
    {
      "code": "LOW",
      "name": "低风险",
      "sortOrder": 3
    }
  ]
}
```

------

## 5. Client-Side Data Processing

### 5.1 Trajectory Point Extraction

```javascript
// Pseudo-code for processing tracking events
const trajectoryPoints = events.map(event => {
  const dataValues = event.dataValues;
  
  return {
    eventId: event.event,
    occurredAt: event.occurredAt,
    coordinates: event.geometry?.coordinates || null, // [lng, lat]
    startDate: findDataValue(dataValues, 'DeStartDt01'),
    endDate: findDataValue(dataValues, 'DeEndDt0001'),
    location: findDataValue(dataValues, 'DeLocDesc01'),
    trackingType: findDataValue(dataValues, 'DeTrackTp01'),
    riskLevel: findDataValue(dataValues, 'DeRiskAsmt1'),
    duration: calculateDuration(
      findDataValue(dataValues, 'DeStartDt01'),
      findDataValue(dataValues, 'DeEndDt0001')
    )
  };
});
```

### 5.2 Risk Level Color Mapping

```javascript
const riskColorMap = {
  'HIGH': '#FF0000',    // Red
  'MEDIUM': '#FFA500',  // Orange/Yellow
  'LOW': '#00FF00'      // Green
};
```

### 5.3 Duration Calculation

```javascript
function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${diffDays}天${diffHours}小时`;
}
```

------

## 6. Error Handling

| Error Scenario            | HTTP Status         | Handling Strategy                          |
| ------------------------- | ------------------- | ------------------------------------------ |
| Tracked entity not found  | 404                 | Display "个案不存在" message               |
| No tracking records found | 200 (empty array)   | Display "暂无追踪记录"                     |
| Invalid date range        | 400                 | Validate dates client-side before API call |
| Missing geometry data     | 200 (null geometry) | Display text-only list, disable map view   |
| Insufficient permissions  | 403                 | Redirect to login or display access denied |

------

## 7. Performance Considerations

- **Caching**: Cache option sets (API-06, API-07) and program metadata (API-03, API-04) for session duration
- **Lazy Loading**: Load map library only when trajectory data is available
- **Debouncing**: Debounce filter input (case number search) by 500ms
- **Batch Requests**: If multiple enrollments exist, fetch all tracking events in parallel using Promise.all()

------

**End of API Contract – WF-4.12 移动轨迹展示页**