# API Contract 2 – Case List Page (WF-4.2)

## 1. Page Description

The Case List page displays a paginated, filterable table of confirmed disease cases (Program 1: "已知疾病个案管理"). Users can search and filter by case number, patient name, disease type, report date, case status, and reporting organization. The page supports sorting, batch operations, and navigation to case details. It retrieves data from DHIS2's Tracker Program 1 and presents tracked entities with their enrollment and case investigation stage data.

## 2. Required DHIS2 APIs

| #    | Endpoint                             | Method | Description                                                  | Key Parameters                                               | Expected Response / Data Type                              |
| ---- | ------------------------------------ | ------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------- |
| 1    | `/api/programs`                      | GET    | Load Program 1 metadata for validation                       | `filter=id:eq:PrgCaseMgt1&fields=id,name,programType,trackedEntityType,programTrackedEntityAttributes[id,mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,name]]]` | Program metadata with attributes                           |
| 2    | `/api/optionSets/OsDiseasCd1`        | GET    | Load disease code options for filter dropdown                | `fields=id,name,options[id,code,name]`                       | OptionSet with disease options                             |
| 3    | `/api/optionSets/OsCaseStat1`        | GET    | Load case status options for filter dropdown                 | `fields=id,name,options[id,code,name]`                       | OptionSet with status options                              |
| 4    | `/api/organisationUnits`             | GET    | Load org units for filter (user's capture scope)             | `filter=path:like:${userOrgUnit}&fields=id,name,code,level`  | List of accessible org units                               |
| 5    | `/api/tracker/trackedEntities`       | GET    | Query tracked entities matching filters                      | `program=PrgCaseMgt1&orgUnits=${orgUnitId}&orgUnitMode=DESCENDANTS&programStatus=ACTIVE&fields=trackedEntity,trackedEntityType,createdAt,updatedAt,orgUnit,attributes[attribute,value,valueType],enrollments[enrollment,enrolledAt,status,attributes[attribute,value]]&page=${page}&pageSize=${pageSize}&order=createdAt:desc&filter=${attributeFilters}&enrollmentEnrolledAfter=${startDate}&enrollmentEnrolledBefore=${endDate}` | Paginated tracked entities with enrollments and attributes |
| 6    | `/api/tracker/trackedEntities/{uid}` | DELETE | Soft-delete a case (if user has F_TEI_CASCADE_DELETE authority) | N/A                                                          | Success/Error status                                       |
| 7    | `/api/tracker`                       | POST   | Batch push selected cases to epidemiological system (update `pushedToEpi` flag) | `importStrategy=UPDATE&atomicMode=OBJECT` with payload containing events with updated `DePushEpi01` data element | Import summary with stats                                  |

## 3. Notes

### Dependencies

- **API 1-4** must complete before **API 5** to populate filter dropdowns and validate query parameters
- **API 5** uses `filter` parameter for attribute-based searches (e.g., `filter=AtrCaseNo01:like:CASE-2024`, `filter=AtrFullNm01:like:张`)
- **API 7** requires **API 5** results to identify case UIDs for batch operations

### Pagination & Filtering

- Use `page=1&pageSize=50` by default
- `totalPages=true` to get total count for pagination UI
- `order` parameter supports: `createdAt, updatedAt, enrolledAt` with `:asc/:desc` suffix
- Filter syntax: `filter=AtrDiseaCd1:eq:${diseaseCode}` for disease type dropdown

### DHIS2-Specific Parameters

- `orgUnitMode=DESCENDANTS`: Include all sub-org units in query scope
- `programStatus=ACTIVE`: Filter by enrollment status (maps to `status` in enrollment object)
- `fields` parameter uses [field filter syntax](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/metadata.html#webapi_metadata_field_filter) to minimize response size

### Metadata Dependencies

- Requires Program 1 (`PrgCaseMgt1`) to be configured with Stage 1 (`PsInvestig1`)
- Requires TrackedEntityType `Person` (`TetPerson01`)
- Requires attributes: `AtrCaseNo01` (case number), `AtrFullNm01` (name), `AtrDiseaCd1` (disease code), `AtrRptDt001` (report date), `AtrRptOrg01` (report org)
- Case status (`DeCaseStat1`) is a data element in Stage 1, not an enrollment attribute

### Security & Access Control

- All queries respect user's capture/search scope org units
- Sharing settings on Program 1 and TrackedEntityType determine visibility
- `F_TRACKED_ENTITY_INSTANCE_SEARCH` authority required for API 5
- `F_TEI_CASCADE_DELETE` authority required for API 6

### Performance Considerations

- Use `fields` parameter to request only necessary data (avoid `fields=*`)
- Consider caching API 1-4 results (metadata rarely changes)
- Implement debouncing for search input to avoid excessive API 5 calls

## 4. Example Request & Response

### API-05: Query Tracked Entities with Filters

**Request:**

```http
GET /api/tracker/trackedEntities?program=PrgCaseMgt1&orgUnits=DiszpKrYNg8&orgUnitMode=DESCENDANTS&fields=trackedEntity,createdAt,updatedAt,orgUnit,attributes[attribute,value,displayName,valueType],enrollments[enrollment,enrolledAt,status,attributes[attribute,value]]&page=1&pageSize=50&order=createdAt:desc&filter=AtrDiseaCd1:eq:OptDiseaB30&enrollmentEnrolledAfter=2024-01-01&enrollmentEnrolledBefore=2024-12-31&totalPages=true
```

**Response:**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 50,
    "total": 156,
    "pageCount": 4
  },
  "trackedEntities": [
    {
      "trackedEntity": "Kj6vYde4LHh",
      "trackedEntityType": "TetPerson01",
      "createdAt": "2024-01-15T14:30:00.000",
      "updatedAt": "2024-01-16T09:20:00.000",
      "orgUnit": "DiszpKrYNg8",
      "attributes": [
        {
          "attribute": "AtrCaseNo01",
          "value": "CASE-20240115-0156",
          "displayName": "个案编号",
          "valueType": "TEXT"
        },
        {
          "attribute": "AtrFullNm01",
          "value": "张三",
          "displayName": "姓名",
          "valueType": "TEXT"
        },
        {
          "attribute": "AtrDiseaCd1",
          "value": "OptDiseaB30",
          "displayName": "疾病编码",
          "valueType": "TEXT"
        },
        {
          "attribute": "AtrRptDt001",
          "value": "2024-01-15",
          "displayName": "报告日期",
          "valueType": "DATE"
        }
      ],
      "enrollments": [
        {
          "enrollment": "MNWZ6hnuhSw",
          "enrolledAt": "2024-01-15T00:00:00.000",
          "status": "ACTIVE",
          "attributes": [
            {
              "attribute": "AtrCaseSrc1",
              "value": "OptActivSv1"
            }
          ]
        }
      ]
    },
    {
      "trackedEntity": "Gjaiu3ea38E",
      "trackedEntityType": "TetPerson01",
      "createdAt": "2024-01-15T10:45:00.000",
      "updatedAt": "2024-01-15T10:45:00.000",
      "orgUnit": "DiszpKrYNg8",
      "attributes": [
        {
          "attribute": "AtrCaseNo01",
          "value": "CASE-20240115-0155",
          "displayName": "个案编号",
          "valueType": "TEXT"
        },
        {
          "attribute": "AtrFullNm01",
          "value": "李四",
          "displayName": "姓名",
          "valueType": "TEXT"
        },
        {
          "attribute": "AtrDiseaCd1",
          "value": "OptDiseaB30",
          "displayName": "疾病编码",
          "valueType": "TEXT"
        },
        {
          "attribute": "AtrRptDt001",
          "value": "2024-01-15",
          "displayName": "报告日期",
          "valueType": "DATE"
        }
      ],
      "enrollments": [
        {
          "enrollment": "JMgRZyeLWO1",
          "enrolledAt": "2024-01-15T00:00:00.000",
          "status": "ACTIVE",
          "attributes": [
            {
              "attribute": "AtrCaseSrc1",
              "value": "OptPassRpt1"
            }
          ]
        }
      ]
    }
  ]
}
```

### API-07: Batch Push to Epidemiological System

**Request:**

```http
POST /api/tracker?importStrategy=UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "events": [
    {
      "event": "evt001",
      "programStage": "PsInvestig1",
      "program": "PrgCaseMgt1",
      "enrollment": "MNWZ6hnuhSw",
      "trackedEntity": "Kj6vYde4LHh",
      "orgUnit": "DiszpKrYNg8",
      "status": "ACTIVE",
      "occurredAt": "2024-01-15T00:00:00.000",
      "dataValues": [
        {
          "dataElement": "DePushEpi01",
          "value": "true"
        },
        {
          "dataElement": "DePushEpiDt",
          "value": "2024-01-16T09:30:00.000"
        }
      ]
    },
    {
      "event": "evt002",
      "programStage": "PsInvestig1",
      "program": "PrgCaseMgt1",
      "enrollment": "JMgRZyeLWO1",
      "trackedEntity": "Gjaiu3ea38E",
      "orgUnit": "DiszpKrYNg8",
      "status": "ACTIVE",
      "occurredAt": "2024-01-15T00:00:00.000",
      "dataValues": [
        {
          "dataElement": "DePushEpi01",
          "value": "true"
        },
        {
          "dataElement": "DePushEpiDt",
          "value": "2024-01-16T09:30:00.000"
        }
      ]
    }
  ]
}
```

**Response:**

```json
{
  "status": "OK",
  "stats": {
    "created": 0,
    "updated": 2,
    "deleted": 0,
    "ignored": 0,
    "total": 2
  },
  "bundleReport": {
    "typeReportMap": {
      "EVENT": {
        "trackerType": "EVENT",
        "stats": {
          "created": 0,
          "updated": 2,
          "deleted": 0,
          "ignored": 0,
          "total": 2
        },
        "objectReports": [
          {
            "trackerType": "EVENT",
            "uid": "evt001",
            "errorReports": []
          },
          {
            "trackerType": "EVENT",
            "uid": "evt002",
            "errorReports": []
          }
        ]
      }
    }
  }
}
```

------

