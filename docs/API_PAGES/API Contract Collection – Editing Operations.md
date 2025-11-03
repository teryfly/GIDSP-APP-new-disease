# API Contract Collection – Editing Operations

## Overview

This document consolidates all **editing-related API contracts** across the system, organized by entity type. Each contract defines the DHIS2 REST API interactions required for update operations.

------

## 1. Tracked Entity Editing APIs

### API-EDIT-01: Update Tracked Entity Basic Information

**Purpose:** Update tracked entity's basic information and attributes (excluding enrollments/events)

**Endpoint:** `/api/tracker`
 **Method:** `POST`
 **Content-Type:** `application/json`

**Key Parameters:**

- `importStrategy=UPDATE`
- `async=false` (for synchronous response)

**Request Body Structure:**

```json
{
  "trackedEntities": [
    {
      "trackedEntity": "PQfMcpmXeFE",
      "trackedEntityType": "nEenWmSyUEp",
      "orgUnit": "DiszpKrYNg8",
      "geometry": {
        "type": "Point",
        "coordinates": [104.065735, 30.659462]
      },
      "attributes": [
        {
          "attribute": "w75KJ2mc4zz",
          "value": "Updated Name"
        },
        {
          "attribute": "zDhUuAYrxNC",
          "value": "Updated Surname"
        }
      ]
    }
  ]
}
```

**Expected Response:**

```json
{
  "status": "OK",
  "stats": {
    "created": 0,
    "updated": 1,
    "deleted": 0,
    "ignored": 0
  },
  "bundleReport": {
    "typeReportMap": {
      "TRACKED_ENTITY": {
        "objectReports": [
          {
            "trackerType": "TRACKED_ENTITY",
            "uid": "PQfMcpmXeFE",
            "errorReports": []
          }
        ]
      }
    }
  }
}
```

**Notes:**

- Must include ALL non-collection fields even if unchanged
- Omitted attributes retain their existing values
- Cannot edit `trackedEntity` (UID), `trackedEntityType`, `createdAt`
- Geometry is optional; omit if no location update needed

------

### API-EDIT-02: Update Tracked Entity Attribute Value

**Purpose:** Update a single attribute value of a tracked entity

**Endpoint:** `/api/tracker`
 **Method:** `POST`
 **Import Strategy:** `UPDATE`

**Request Body:**

```json
{
  "trackedEntities": [
    {
      "trackedEntity": "PQfMcpmXeFE",
      "trackedEntityType": "nEenWmSyUEp",
      "orgUnit": "DiszpKrYNg8",
      "attributes": [
        {
          "attribute": "w75KJ2mc4zz",
          "value": "Johnny"
        }
      ]
    }
  ]
}
```

**Key Considerations:**

- Only changed attributes need to be included
- Unchanged attributes are preserved automatically
- To delete an attribute value, set `value: null`

------

### API-EDIT-03: Delete Tracked Entity Attribute Value

**Purpose:** Remove a specific attribute value from a tracked entity

**Endpoint:** `/api/tracker`
 **Method:** `POST`
 **Import Strategy:** `UPDATE`

**Request Body:**

```json
{
  "trackedEntities": [
    {
      "trackedEntity": "PQfMcpmXeFE",
      "trackedEntityType": "nEenWmSyUEp",
      "orgUnit": "DiszpKrYNg8",
      "attributes": [
        {
          "attribute": "w75KJ2mc4zz",
          "value": null
        }
      ]
    }
  ]
}
```

------

## 2. Enrollment Editing APIs

### API-EDIT-04: Update Enrollment Information

**Purpose:** Update enrollment status, dates, or program attributes

**Endpoint:** `/api/tracker`
 **Method:** `POST`
 **Import Strategy:** `UPDATE`

**Request Body:**

```json
{
  "enrollments": [
    {
      "enrollment": "JMgRZyeLWOo",
      "program": "IpHINAT79UW",
      "trackedEntity": "PQfMcpmXeFE",
      "orgUnit": "DiszpKrYNg8",
      "status": "COMPLETED",
      "enrolledAt": "2024-03-06T00:00:00.000",
      "occurredAt": "2024-03-04T00:00:00.000",
      "completedAt": "2024-03-20T00:00:00.000",
      "attributes": [
        {
          "attribute": "ruQQnf6rswq",
          "value": "Updated TB Number"
        }
      ]
    }
  ]
}
```

**Editable Fields:**

- `status` (ACTIVE/COMPLETED/CANCELLED)
- `orgUnit`
- `enrolledAt`
- `occurredAt`
- `followUp`
- `geometry`
- Program-specific attributes

**Immutable Fields:**

- `enrollment` (UID)
- `program`
- `trackedEntity`
- `createdAt`

------

### API-EDIT-05: Update Enrollment Status Only

**Purpose:** Change enrollment status (e.g., complete/cancel enrollment)

**Endpoint:** `/api/tracker`
 **Method:** `POST`

**Request Body:**

```json
{
  "enrollments": [
    {
      "enrollment": "JMgRZyeLWOo",
      "program": "IpHINAT79UW",
      "trackedEntity": "PQfMcpmXeFE",
      "orgUnit": "DiszpKrYNg8",
      "status": "COMPLETED",
      "enrolledAt": "2024-03-06T00:00:00.000",
      "occurredAt": "2024-03-04T00:00:00.000"
    }
  ]
}
```

**Status Values:**

- `ACTIVE` - Ongoing enrollment
- `COMPLETED` - Enrollment completed
- `CANCELLED` - Enrollment cancelled

------

## 3. Event Editing APIs

### API-EDIT-06: Update Event Basic Information

**Purpose:** Update event status, dates, or assigned user

**Endpoint:** `/api/tracker`
 **Method:** `POST`
 **Import Strategy:** `UPDATE`

**Request Body:**

```json
{
  "events": [
    {
      "event": "ZwwuwNp6gVd",
      "programStage": "A03MvHHogjR",
      "enrollment": "MNWZ6hnuhSw",
      "orgUnit": "y77LiPqLMoq",
      "program": "IpHINAT79UW",
      "status": "COMPLETED",
      "occurredAt": "2024-02-15T00:00:00.000",
      "scheduledAt": "2024-02-13T00:00:00.000",
      "completedAt": "2024-02-15T10:30:00.000",
      "assignedUser": {
        "uid": "M0fCOxtkURr"
      },
      "dataValues": [
        {
          "dataElement": "bx6fsa0t90x",
          "value": "true"
        }
      ]
    }
  ]
}
```

**Editable Fields:**

- `status` (ACTIVE/COMPLETED/VISITED/SCHEDULE/OVERDUE/SKIPPED)
- `orgUnit`
- `occurredAt`
- `scheduledAt`
- `completedAt`
- `geometry`
- `assignedUser`
- `dataValues`

**Immutable Fields:**

- `event` (UID)
- `programStage`
- `enrollment`
- `program`
- `createdAt`

------

### API-EDIT-07: Update Event Data Value

**Purpose:** Update a single data element value in an event

**Endpoint:** `/api/tracker`
 **Method:** `POST`

**Request Body:**

```json
{
  "events": [
    {
      "event": "ZwwuwNp6gVd",
      "programStage": "A03MvHHogjR",
      "enrollment": "MNWZ6hnuhSw",
      "orgUnit": "y77LiPqLMoq",
      "program": "IpHINAT79UW",
      "status": "ACTIVE",
      "occurredAt": "2019-08-01T00:00:00.000",
      "scheduledAt": "2019-08-19T13:59:13.688",
      "dataValues": [
        {
          "dataElement": "bx6fsa0t90x",
          "value": "false"
        }
      ]
    }
  ]
}
```

**Notes:**

- Only include changed data values
- Must provide all required event fields
- Unchanged data values are preserved

------

### API-EDIT-08: Delete Event Data Value

**Purpose:** Remove a data value from an event

**Endpoint:** `/api/tracker`
 **Method:** `POST`

**Request Body:**

```json
{
  "events": [
    {
      "event": "ZwwuwNp6gVd",
      "programStage": "A03MvHHogjR",
      "enrollment": "MNWZ6hnuhSw",
      "orgUnit": "y77LiPqLMoq",
      "program": "IpHINAT79UW",
      "status": "ACTIVE",
      "occurredAt": "2019-08-01T00:00:00.000",
      "scheduledAt": "2019-08-19T13:59:13.688",
      "dataValues": [
        {
          "dataElement": "bx6fsa0t90x",
          "value": null
        }
      ]
    }
  ]
}
```

------

## 4. Relationship Editing APIs

### API-EDIT-09: Update Relationship (Not Supported)

**Note:** Relationships are **immutable** in DHIS2. To change a relationship:

1. Delete the existing relationship (API-DELETE-04)
2. Create a new relationship (API-CREATE-05)

------

## 5. Metadata Editing APIs

### API-EDIT-10: Update Disease Code (Option)

**Purpose:** Update disease code option in Option Set

**Endpoint:** `/api/options/{uid}`
 **Method:** `PUT`
 **Content-Type:** `application/json`

**Request Body:**

```json
{
  "code": "A01",
  "name": "鼠疫（更新）",
  "sortOrder": 1,
  "optionSet": {
    "id": "OsDiseasCd1"
  }
}
```

**Expected Response:** HTTP 200 OK

------

### API-EDIT-11: Update Pathogen (Option)

**Purpose:** Update pathogen option in Option Set

**Endpoint:** `/api/options/{uid}`
 **Method:** `PUT`

**Request Body:**

```json
{
  "code": "V103",
  "name": "SARS-CoV-2 (Updated)",
  "sortOrder": 9,
  "optionSet": {
    "id": "OsPathogen1"
  }
}
```

------

### API-EDIT-12: Update Working List Configuration

**Purpose:** Update tracked entity working list settings

**Endpoint:** `/api/trackedEntityInstanceFilters/{uid}`
 **Method:** `PUT`
 **Content-Type:** `application/json`

**Request Body:**

```json
{
  "name": "My Updated Working List",
  "description": "Updated description",
  "program": {
    "id": "IpHINAT79UW"
  },
  "entityQueryCriteria": {
    "enrollmentStatus": "ACTIVE",
    "followUp": true,
    "order": "enrolledAt:desc"
  }
}
```

------

## 6. User & Permission Editing APIs

### API-EDIT-13: Update User Information

**Purpose:** Update user account details

**Endpoint:** `/api/users/{uid}`
 **Method:** `PUT`

**Request Body:**

```json
{
  "firstName": "Updated",
  "surname": "Name",
  "email": "updated@example.com",
  "phoneNumber": "13800000000",
  "userRoles": [
    {
      "id": "UrCityStf01"
    }
  ],
  "organisationUnits": [
    {
      "id": "OuChengdu01"
    }
  ]
}
```

------

## 7. System Configuration Editing APIs

### API-EDIT-14: Update System Settings

**Purpose:** Update system configuration parameters

**Endpoint:** `/api/systemSettings/{key}`
 **Method:** `POST`
 **Content-Type:** `text/plain`

**Example:**

```
POST /api/systemSettings/keyTrackedEntityMaxLimit
Content-Type: text/plain

50
```

------

# Page Usage Reference Table

The following table maps each editing API to the front-end pages (WF-4.X) where it is used:

| API Contract    | Endpoint                                    | Used in Pages  | Purpose                                              |
| --------------- | ------------------------------------------- | -------------- | ---------------------------------------------------- |
| **API-EDIT-01** | POST /api/tracker (TE Update)               | WF-4.3, WF-4.4 | Update tracked entity basic info in detail/edit form |
| **API-EDIT-02** | POST /api/tracker (TE Attribute)            | WF-4.3, WF-4.4 | Update single attribute value in tracked entity      |
| **API-EDIT-03** | POST /api/tracker (Delete Attribute)        | WF-4.3, WF-4.4 | Remove attribute value from tracked entity           |
| **API-EDIT-04** | POST /api/tracker (Enrollment Update)       | WF-4.3         | Update enrollment status/dates in detail page        |
| **API-EDIT-05** | POST /api/tracker (Enrollment Status)       | WF-4.3         | Change enrollment status (complete/cancel)           |
| **API-EDIT-06** | POST /api/tracker (Event Update)            | WF-4.3         | Update event basic information in detail tabs        |
| **API-EDIT-07** | POST /api/tracker (Event Data Value)        | WF-4.3         | Update data element value in event detail            |
| **API-EDIT-08** | POST /api/tracker (Delete Data Value)       | WF-4.3         | Remove data value from event                         |
| **API-EDIT-09** | N/A (Use Delete + Create)                   | WF-4.3         | Modify relationship (not directly editable)          |
| **API-EDIT-10** | PUT /api/options/{uid}                      | WF-4.10        | Update disease code in metadata management           |
| **API-EDIT-11** | PUT /api/options/{uid}                      | WF-4.11        | Update pathogen option in metadata management        |
| **API-EDIT-12** | PUT /api/trackedEntityInstanceFilters/{uid} | WF-4.2         | Update working list configuration settings           |
| **API-EDIT-13** | PUT /api/users/{uid}                        | WF-4.18        | Update user account in user management               |
| **API-EDIT-14** | POST /api/systemSettings/{key}              | WF-4.15        | Update system configuration parameters               |

------

## Detailed Page-API Mapping

### WF-4.2: Individual Case List Page (个案列表页)

- **API-EDIT-12**: Update working list filters/sorting

------

### WF-4.3: Individual Case Detail Page (个案详情页)

**Tabs and their Edit APIs:**

| Tab                     | API Used                 | Operation                                 |
| ----------------------- | ------------------------ | ----------------------------------------- |
| 基本信息 (Basic Info)   | API-EDIT-01, API-EDIT-02 | Edit patient info, attributes             |
| 流行病学 (Epidemiology) | API-EDIT-04              | Update exposure history in enrollment     |
| 随访记录 (Follow-up)    | API-EDIT-06, API-EDIT-07 | Edit follow-up events and data values     |
| 治疗记录 (Treatment)    | API-EDIT-06, API-EDIT-07 | Edit treatment events and outcomes        |
| 检测记录 (Test Records) | API-EDIT-06, API-EDIT-07 | Update test results and status            |
| 追踪记录 (Tracking)     | API-EDIT-06, API-EDIT-07 | Edit tracking records and risk assessment |

------

### WF-4.4: New Case Form Page (新增个案表单页)

- **API-EDIT-01**: Used when user clicks "Save Draft" then returns to edit
- **API-EDIT-02**: Update attribute values during form editing

------

### WF-4.10: Disease Code Management (疾病编码管理页)

- API-EDIT-10

  : Edit disease code option

  - Click [编辑] button in disease list
  - Update code, name, or sort order

------

### WF-4.11: Pathogen Management (病原微生物目录)

- API-EDIT-11

  : Edit pathogen option

  - Click [编辑] button in pathogen list
  - Update pathogen name, code, or type

------

### WF-4.15: System Configuration (系统配置管理页)

- API-EDIT-14

  : Update system settings

  - Modify configuration values in different tabs
  - Save changes to DHIS2 system settings

------

### WF-4.18: User Management (用户管理页)

- API-EDIT-13

  : Edit user account

  - Click [编辑] button in user list
  - Update user role, org unit, or contact info

------

## Integration Notes

### Cross-Page Editing Workflows

1. **Case Management Flow (WF-4.2 → WF-4.3 → WF-4.4)**
   - WF-4.2: User clicks [编辑] → navigate to WF-4.3
   - WF-4.3: Edit in tabs → call API-EDIT-01~08 per section
   - WF-4.4: Edit case form → call API-EDIT-01/02 on save
2. **Metadata Management Flow (WF-4.10, WF-4.11)**
   - List page shows current options
   - [编辑] button opens edit modal
   - API-EDIT-10/11 called on modal save
   - List refreshed after successful update
3. **Configuration Management (WF-4.15, WF-4.18)**
   - Tabbed interface with forms
   - [保存配置] button triggers API-EDIT-13/14
   - Success notification after update

------

## Validation & Error Handling

### Common Validation Rules (All Edit APIs)

1. **Permission Checks:**
   - User must have write access to target entity
   - Organisation unit must be in user's capture scope
   - Program/Program Stage sharing settings apply
2. **Data Integrity:**
   - Mandatory fields cannot be set to null
   - Date ranges must be logical (enrolledAt ≤ occurredAt)
   - Option values must exist in configured Option Sets
3. **Status Transitions:**
   - Some status changes are restricted (see state machines)
   - Deleted entities cannot be edited (must undelete first)

### Error Response Format

```json
{
  "status": "ERROR",
  "validationReport": {
    "errorReports": [
      {
        "message": "User has no write access",
        "errorCode": "E1000",
        "trackerType": "TRACKED_ENTITY",
        "uid": "PQfMcpmXeFE"
      }
    ]
  }
}
```

------

## Performance Considerations

1. **Batch Updates:**
   - Multiple entities can be updated in single POST /api/tracker call
   - Reduces API overhead for bulk operations
2. **Field Selection:**
   - Use `fields` parameter to minimize response payload
   - Only request fields needed for UI display
3. **Async vs Sync:**
   - Use `async=true` for large batch updates
   - Use `async=false` for immediate UI feedback

------

## Testing Checklist

For each editing API, verify:

- [ ] Valid UID supplied returns 200 OK
- [ ] Invalid UID returns 404 Not Found
- [ ] Unauthorized user returns 403 Forbidden
- [ ] Missing required fields returns 400 Bad Request
- [ ] Immutable fields ignored in request
- [ ] Optimistic locking (if applicable) prevents conflicts
- [ ] Audit log entry created for sensitive changes

------

