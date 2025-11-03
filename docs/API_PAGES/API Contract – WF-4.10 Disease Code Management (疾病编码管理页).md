# API Contract – WF-4.10: Disease Code Management (疾病编码管理页)

## 1. Page Description

The Disease Code Management page enables authorized users (system administrators and CDC business personnel) to perform CRUD operations on quarantine infectious disease codes (UC01). This page manages DHIS2 Option Sets that represent disease classifications and codes, supporting batch import/export and status management (enable/disable). The disease codes are used throughout the tracker system for enrollment and event categorization.

------

## 2. Required DHIS2 APIs

| #    | Endpoint                              | Method | Description                                            | Key Parameters                                               | Expected Response / Data Type                      |
| ---- | ------------------------------------- | ------ | ------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------- |
| 1    | `/api/optionSets/OsDiseasCd1`         | GET    | Retrieve the Disease Code Option Set with all options  | `fields=id,name,code,options[id,name,code,sortOrder]`        | OptionSet object with embedded Options array       |
| 2    | `/api/options`                        | GET    | Retrieve individual disease code options for filtering | `filter=optionSet.id:eq:OsDiseasCd1&fields=id,name,code,sortOrder&paging=false` | List<Option>                                       |
| 3    | `/api/options/{uid}`                  | GET    | Retrieve details of a specific disease code option     | `fields=id,name,code,sortOrder,style,attributeValues`        | Option object                                      |
| 4    | `/api/options`                        | POST   | Create a new disease code option                       | Body: Option object with `name`, `code`, `sortOrder`         | `{ "status": "OK", "response": { "uid": "..." } }` |
| 5    | `/api/options/{uid}`                  | PUT    | Update an existing disease code option                 | Body: Updated Option object                                  | `{ "status": "OK" }`                               |
| 6    | `/api/options/{uid}`                  | DELETE | Delete a disease code option (soft delete)             | None                                                         | `{ "status": "OK" }`                               |
| 7    | `/api/optionSets/OsDiseasCd1/options` | POST   | Add option to option set (if not automatically linked) | Body: `{ "id": "optionUid" }`                                | `{ "status": "OK" }`                               |
| 8    | `/api/metadata`                       | POST   | Batch import disease codes via metadata payload        | Body: Metadata bundle with options array                     | Import summary with stats                          |
| 9    | `/api/metadata`                       | GET    | Export disease codes metadata for backup               | `filter=id:eq:OsDiseasCd1&filter=options:in:[...]&assumeTrue=false` | Metadata bundle JSON                               |
| 10   | `/api/sharing?type=option&id={uid}`   | GET    | Check sharing settings for an option                   | None                                                         | Sharing object with userAccesses/userGroupAccesses |
| 11   | `/api/sharing?type=option&id={uid}`   | PUT    | Update sharing settings for an option                  | Body: Sharing object                                         | `{ "status": "OK" }`                               |

------

## 3. Notes

### 3.1 Key Dependencies

- **Metadata Initialization**: The Option Set `OsDiseasCd1` (疾病编码) must exist before options can be managed. See Metadata Initialization File for pre-created structure.
- **Option-OptionSet Relationship**: Options created via API-04 need explicit association with `OsDiseasCd1` via API-07 if not auto-linked.
- **Pagination**: API-02 uses `paging=false` to retrieve all options for table display. For large datasets, implement client-side pagination.

### 3.2 Query Parameters

- **API-01 `fields` parameter**: Requests specific fields to reduce payload size. Use `options[id,name,code,sortOrder]` to include nested option details.
- **API-02 `filter` parameter**: Filters options belonging to the disease code option set using `optionSet.id:eq:OsDiseasCd1`.

### 3.3 Business Logic

- Enable/Disable

  : DHIS2 does not natively support "status" fields for options. Implement status using:

  - **Option Attribute Values**: Create a custom attribute (e.g., `STATUS`) and assign values via `attributeValues` array in Option object.
  - **Alternative**: Use sharing settings to restrict access (disabled options have `publicAccess: "--------"`).

- Disease Categories (甲类/乙类/丙类)

  : Store category information using:

  - **Option Group Sets**: Create groups like "甲类疾病", "乙类疾病" and assign options accordingly.
  - **Code Prefix**: Use code prefixes (A01, B01, C01) to denote categories.

### 3.4 Batch Operations

- Import/Export

  : Use API-08 and API-09 for bulk operations.

  - Export includes Option Set + Options in a single metadata bundle.
  - Import validates uniqueness of `code` fields to prevent duplicates.

### 3.5 Security

- **User Authority**: Requires `F_OPTION_SET_PUBLIC_ADD` and `F_OPTION_SET_DELETE` authorities.
- **Sharing**: Options inherit sharing from parent Option Set. Ensure `OsDiseasCd1` has appropriate sharing settings for CDC user groups.

------

## 4. Example Request & Response

### API-01: Retrieve Disease Code Option Set

**Request**

```http
GET /api/optionSets/OsDiseasCd1?fields=id,name,code,options[id,name,code,sortOrder]
```

**Response**

```json
{
  "id": "OsDiseasCd1",
  "name": "疾病编码",
  "code": "DISEASE_CODE",
  "options": [
    {
      "id": "OptDiseaA10",
      "name": "鼠疫",
      "code": "A01",
      "sortOrder": 1
    },
    {
      "id": "OptDiseaA20",
      "name": "霍乱",
      "code": "A02",
      "sortOrder": 2
    },
    {
      "id": "OptDiseaB30",
      "name": "新型冠状病毒肺炎(COVID-19)",
      "code": "B03",
      "sortOrder": 11
    }
  ]
}
```

------

### API-02: Filter and Retrieve Options

**Request**

```http
GET /api/options?filter=optionSet.id:eq:OsDiseasCd1&filter=code:like:A&fields=id,name,code,sortOrder&paging=false
```

**Response**

```json
{
  "options": [
    {
      "id": "OptDiseaA10",
      "name": "鼠疫",
      "code": "A01",
      "sortOrder": 1
    },
    {
      "id": "OptDiseaA20",
      "name": "霍乱",
      "code": "A02",
      "sortOrder": 2
    }
  ]
}
```

------

### API-04: Create New Disease Code

**Request**

```http
POST /api/options
Content-Type: application/json

{
  "name": "黄热病",
  "code": "A03",
  "sortOrder": 3,
  "optionSet": {
    "id": "OsDiseasCd1"
  }
}
```

**Response**

```json
{
  "httpStatus": "Created",
  "httpStatusCode": 201,
  "status": "OK",
  "response": {
    "responseType": "ObjectReport",
    "uid": "OptDiseaA30",
    "klass": "org.hisp.dhis.option.Option"
  }
}
```

------

### API-05: Update Disease Code

**Request**

```http
PUT /api/options/OptDiseaA10
Content-Type: application/json

{
  "id": "OptDiseaA10",
  "name": "鼠疫（已更新）",
  "code": "A01",
  "sortOrder": 1,
  "optionSet": {
    "id": "OsDiseasCd1"
  }
}
```

**Response**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "message": "Update successful"
}
```

------

### API-06: Delete Disease Code (Soft Delete)

**Request**

```http
DELETE /api/options/OptDiseaA80
```

**Response**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "message": "Deletion successful"
}
```

------

### API-08: Batch Import Disease Codes

**Request**

```http
POST /api/metadata
Content-Type: application/json

{
  "options": [
    {
      "id": "OptDiseaF10",
      "name": "炭疽",
      "code": "F01",
      "sortOrder": 17,
      "optionSet": {
        "id": "OsDiseasCd1"
      }
    },
    {
      "id": "OptDiseaG10",
      "name": "艾滋病(AIDS)",
      "code": "G01",
      "sortOrder": 18,
      "optionSet": {
        "id": "OsDiseasCd1"
      }
    }
  ]
}
```

**Response**

```json
{
  "status": "OK",
  "stats": {
    "created": 2,
    "updated": 0,
    "deleted": 0,
    "ignored": 0
  },
  "typeReports": [
    {
      "klass": "org.hisp.dhis.option.Option",
      "stats": {
        "created": 2,
        "updated": 0,
        "deleted": 0,
        "ignored": 0
      }
    }
  ]
}
```

------

### API-09: Export Disease Codes Metadata

**Request**

```http
GET /api/metadata?filter=id:eq:OsDiseasCd1&assumeTrue=false&download=true
```

**Response** (Metadata Bundle)

```json
{
  "optionSets": [
    {
      "id": "OsDiseasCd1",
      "name": "疾病编码",
      "code": "DISEASE_CODE",
      "valueType": "TEXT"
    }
  ],
  "options": [
    {
      "id": "OptDiseaA10",
      "name": "鼠疫",
      "code": "A01",
      "sortOrder": 1
    },
    {
      "id": "OptDiseaA20",
      "name": "霍乱",
      "code": "A02",
      "sortOrder": 2
    }
  ]
}
```

------

### API-10: Check Sharing Settings

**Request**

```http
GET /api/sharing?type=option&id=OptDiseaA10
```

**Response**

```json
{
  "meta": {
    "allowPublicAccess": true,
    "allowExternalAccess": false
  },
  "object": {
    "id": "OptDiseaA10",
    "name": "鼠疫",
    "publicAccess": "rw------",
    "externalAccess": false,
    "userGroupAccesses": [
      {
        "id": "UgProvStf01",
        "access": "rw------"
      }
    ],
    "userAccesses": []
  }
}
```

------

## 5. Implementation Considerations

### 5.1 Front-End Table Rendering

- Fetch all options via API-02 with `paging=false`.
- Render table rows with columns: `code`, `name`, `category` (derived from code prefix), `status` (from attribute values), `updatedAt`.
- Implement client-side filtering for "编码", "名称", "类别" dropdowns.

### 5.2 Enable/Disable Toggle

Since DHIS2 options lack native status fields:

- **Option 1**: Create a custom attribute `STATUS` (TEXT type) on the Option object model. Store "启用" or "停用" in `attributeValues`.

- Option 2

  : Use sharing settings:

  - Enabled: `publicAccess: "rw------"`
  - Disabled: `publicAccess: "--------"` (no read access for public)

### 5.3 Category Mapping

- **Option Group Sets Approach**:
  - Create Option Groups: `OgClass1` (甲类疾病), `OgClass2` (乙类疾病), `OgClass3` (丙类疾病).
  - Assign options to groups via API: `POST /api/optionGroups/{uid}/options`.
  - Query category via: `GET /api/optionGroups?filter=options.id:eq:{optionUid}&fields=name`.
- **Code Prefix Approach** (Simpler):
  - Parse first character of `code` field: A=甲类, B=乙类, C=丙类.
  - Display category in table by checking `code.charAt(0)`.

### 5.4 Batch Import Workflow

1. User uploads Excel/CSV file.
2. Front-end parses file and maps columns to Option object structure.
3. Generate UIDs for new options using `POST /api/system/id?limit=N`.
4. Construct metadata bundle JSON and POST to API-08.
5. Display import summary (created/updated/ignored counts).

### 5.5 User Permissions

- Users must have authorities: `F_OPTION_SET_PUBLIC_ADD`, `F_OPTION_SET_DELETE`.
- Check user authority via: `GET /api/me?fields=authorities`.
- Disable create/edit/delete buttons if user lacks permissions.

