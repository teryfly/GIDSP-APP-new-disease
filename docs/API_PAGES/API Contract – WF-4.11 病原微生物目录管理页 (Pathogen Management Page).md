# API Contract – WF-4.11 病原微生物目录管理页 (Pathogen Management Page)

## 1. Page Description

This page enables authorized personnel (疾控业务人员/系统管理员) to perform CRUD operations on the Pathogen metadata catalog. Pathogens are represented as Options within an Option Set (`OsPathogen1`) in DHIS2. The page supports creating, editing, enabling/disabling pathogens, batch import/export, and managing pathogen-disease associations through Option Groups. Users can filter by code, name, and type (virus, bacteria, other) and view associated diseases for each pathogen.

------

## 2. Required DHIS2 APIs

| #    | Endpoint                      | Method | Description                                    | Key Parameters                                               | Expected Response / Data Type                                |
| ---- | ----------------------------- | ------ | ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 1    | `/api/optionSets/OsPathogen1` | GET    | Load the Pathogen Option Set with all options  | `fields=id,name,options[id,code,name,sortOrder]`             | OptionSet with embedded Options array                        |
| 2    | `/api/options`                | GET    | Query pathogen options with filters            | `filter=optionSet.id:eq:OsPathogen1`, `filter=code:ilike:{searchCode}`, `filter=name:ilike:{searchName}`, `fields=id,code,name,sortOrder`, `paging=true`, `page={pageNumber}`, `pageSize={pageSize}` | Paged list of Options                                        |
| 3    | `/api/options`                | POST   | Create a new pathogen option                   | Request body: `{ "code": "V107", "name": "新病原体名称", "sortOrder": 33, "optionSet": {"id": "OsPathogen1"} }` | `{ "httpStatus": "Created", "response": { "uid": "newOptionUid" } }` |
| 4    | `/api/options/{uid}`          | PUT    | Update an existing pathogen option             | Path: option UID; Body: `{ "code": "V107", "name": "更新后名称", "sortOrder": 33 }` | `{ "httpStatus": "OK" }`                                     |
| 5    | `/api/options/{uid}`          | DELETE | Delete a pathogen option                       | Path: option UID                                             | `{ "httpStatus": "OK" }`                                     |
| 6    | `/api/optionGroups`           | GET    | Load all pathogen type groups (病毒/细菌/其他) | `filter=optionSet.id:eq:OsPathogen1`, `fields=id,name,code,options[id,code,name]` | List of OptionGroups with embedded options                   |
| 7    | `/api/optionGroups`           | POST   | Create or update pathogen type classification  | Body: `{ "name": "病毒类病原体", "code": "VIRUS", "optionSet": {"id": "OsPathogen1"}, "options": [{"id": "OptPathV010"}, ...] }` | `{ "httpStatus": "Created", "response": { "uid": "groupUid" } }` |
| 8    | `/api/optionGroups`           | GET    | Load disease-pathogen association groups       | `filter=name:like:疾病相关`, `fields=id,name,code,options[id,code,name]` | List of OptionGroups representing disease associations       |
| 9    | `/api/optionGroups/{uid}`     | PUT    | Update disease-pathogen associations           | Path: group UID; Body: `{ "options": [{"id": "OptPathV103"}, ...] }` | `{ "httpStatus": "OK" }`                                     |
| 10   | `/api/options.csv`            | GET    | Export pathogen options as CSV                 | `optionSet=OsPathogen1`, `fields=code,name,sortOrder`        | CSV file stream                                              |
| 11   | `/api/metadata`               | POST   | Batch import pathogen options via CSV          | Body: CSV file with headers `code,name,sortOrder,optionSet`, ContentType: `application/csv` | Import summary with created/updated counts                   |

------

## 3. Notes

### 3.1 Inter-API Dependencies

- **API-01** must load before rendering the table to display existing pathogens.
- **API-06** should load at page initialization to populate the "类型" (Type) filter dropdown.
- **API-08** is required when displaying the "关联疾病" (Associated Diseases) column.
- **API-03/04/05** are triggered by user actions (Create/Edit/Delete buttons).

### 3.2 DHIS2-Specific Parameters

- **Filtering:** Use `filter=optionSet.id:eq:OsPathogen1` to restrict results to pathogen options only.
- **Pagination:** Apply `paging=true&page=1&pageSize=50` for table pagination.
- **Search:** Use `filter=code:ilike:{input}` for case-insensitive code/name search.
- **Field Selection:** Use `fields=id,code,name,sortOrder,optionSet[id]` to minimize payload.

### 3.3 Metadata Dependencies

- **Option Set UID:** `OsPathogen1` (as defined in Metadata Initialization File).
- **Sample Option UIDs:** `OptPathV010` (埃博拉病毒), `OptPathB001` (霍乱弧菌), etc.
- **Option Groups:** Disease-specific groups like "霍乱相关病原体" link pathogens to diseases via `DiseasePathogenMapping`.

### 3.4 Business Logic Constraints

- **Uniqueness:** Option `code` must be unique within `OsPathogen1`.
- **Soft Delete:** Use `PUT /api/options/{uid}` with `{ "disabled": true }` to "disable" instead of hard delete if UI uses "停用/启用" toggle.
- **Batch Operations:** For bulk import, use `/api/metadata` with CSV payload containing `optionSet=OsPathogen1` reference.

### 3.5 Permission Requirements

- User must have `F_OPTIONSET_PUBLIC_ADD` authority to create options.
- User must have `F_OPTION_DELETE` authority to delete options.
- Metadata write access to `OsPathogen1` is required for all CUD operations.

------

## 4. Example Request & Response

### API-01: 加载病原微生物列表 (Load Pathogen List)

**[请求地址]**

```
GET http://[基地址]/api/options?filter=optionSet.id:eq:OsPathogen1&fields=id,code,name,sortOrder&paging=true&page=1&pageSize=50
```

**[请求动作]**: GET

**[返回消息体]**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 50,
    "total": 32
  },
  "options": [
    {
      "id": "OptPathV010",
      "code": "V001",
      "name": "埃博拉病毒",
      "sortOrder": 1
    },
    {
      "id": "OptPathV103",
      "code": "V103",
      "name": "SARS-CoV-2 (新冠病毒)",
      "sortOrder": 9
    },
    {
      "id": "OptPathB001",
      "code": "B001",
      "name": "霍乱弧菌 (O1血清型)",
      "sortOrder": 25
    }
  ]
}
```

**[主要参数说明]**

| 节点名称            | 类型    | 必填 | 描述                 |
| ------------------- | ------- | ---- | -------------------- |
| pager.total         | integer | 是   | 病原体总数           |
| options             | array   | 是   | 病原体选项集合       |
| options[].id        | string  | 是   | 病原体UID            |
| options[].code      | string  | 是   | 病原体编码 (如 V103) |
| options[].name      | string  | 是   | 病原体名称           |
| options[].sortOrder | integer | 是   | 排序序号             |

------

### API-03: 新增病原体 (Create Pathogen)

**[请求地址]**

```
POST http://[基地址]/api/options
```

**[请求动作]**: POST

**[请求消息体]**

```json
{
  "code": "V107",
  "name": "新型流感病毒H5N8",
  "sortOrder": 33,
  "optionSet": {
    "id": "OsPathogen1"
  }
}
```

**[返回消息体]**

```json
{
  "httpStatus": "Created",
  "httpStatusCode": 201,
  "status": "OK",
  "response": {
    "responseType": "ObjectReport",
    "uid": "newOptionUid123",
    "klass": "org.hisp.dhis.option.Option"
  }
}
```

------

### API-06: 加载病原体类型分组 (Load Pathogen Type Groups)

**[请求地址]**

```
GET http://[基地址]/api/optionGroups?filter=optionSet.id:eq:OsPathogen1&fields=id,name,code,options[id,code,name]
```

**[请求动作]**: GET

**[返回消息体]**

```json
{
  "optionGroups": [
    {
      "id": "OgVirusPath",
      "name": "病毒类病原体",
      "code": "VIRUS",
      "options": [
        {
          "id": "OptPathV010",
          "code": "V001",
          "name": "埃博拉病毒"
        },
        {
          "id": "OptPathV103",
          "code": "V103",
          "name": "SARS-CoV-2 (新冠病毒)"
        }
      ]
    },
    {
      "id": "OgBacteriaPath",
      "name": "细菌类病原体",
      "code": "BACTERIA",
      "options": [
        {
          "id": "OptPathB001",
          "code": "B001",
          "name": "霍乱弧菌 (O1血清型)"
        }
      ]
    }
  ]
}
```

------

### API-08: 加载病原体-疾病关联 (Load Pathogen-Disease Associations)

**[请求地址]**

```
GET http://[基地址]/api/optionGroups?filter=name:like:相关病原体&fields=id,name,code,options[id,code,name]
```

**[请求动作]**: GET

**[返回消息体]**

```json
{
  "optionGroups": [
    {
      "id": "OgCholeraPath",
      "name": "霍乱相关病原体",
      "code": "CHOLERA_PATHOGENS",
      "options": [
        {
          "id": "OptPathB001",
          "code": "B001",
          "name": "霍乱弧菌 (O1血清型)"
        },
        {
          "id": "OptPathB002",
          "code": "B002",
          "name": "霍乱弧菌 (O139血清型)"
        }
      ]
    },
    {
      "id": "OgCovidPath",
      "name": "新冠肺炎相关病原体",
      "code": "COVID19_PATHOGENS",
      "options": [
        {
          "id": "OptPathV103",
          "code": "V103",
          "name": "SARS-CoV-2 (新冠病毒)"
        },
        {
          "id": "OptPathV104",
          "code": "V104",
          "name": "SARS-CoV-2 Alpha变异株"
        }
      ]
    }
  ]
}
```

**[主要参数说明]**

| 节点名称               | 类型   | 必填 | 描述                    |
| ---------------------- | ------ | ---- | ----------------------- |
| optionGroups[].name    | string | 是   | 疾病名称 + "相关病原体" |
| optionGroups[].options | array  | 是   | 该疾病关联的病原体列表  |

------

### API-10: 导出病原体CSV (Export Pathogens as CSV)

**[请求地址]**

```
GET http://[基地址]/api/options.csv?optionSet=OsPathogen1&fields=code,name,sortOrder
```

**[请求动作]**: GET

**[返回消息体]** (CSV格式)

```csv
code,name,sortOrder
V001,埃博拉病毒,1
V002,马尔堡病毒,2
V103,SARS-CoV-2 (新冠病毒),9
B001,霍乱弧菌 (O1血清型),25
```

------

## 5. UI-to-API Mapping

| UI Component                       | Triggered API                            | Notes                                                      |
| ---------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| 页面加载 (Page Load)               | API-01, API-06, API-08                   | Fetch pathogen list, type groups, and disease associations |
| 筛选条件查询 (Filter Query)        | API-02                                   | Use `filter=code:ilike:` and `filter=name:ilike:`          |
| "新增病原体" 按钮 (Add Button)     | API-03                                   | Open modal, submit form triggers POST                      |
| "编辑" 按钮 (Edit Button)          | API-04                                   | Load existing data, submit triggers PUT                    |
| "删除/停用" 按钮 (Delete/Disable)  | API-05 or API-04 with `{disabled: true}` | Depending on soft/hard delete requirement                  |
| "导出" 按钮 (Export Button)        | API-10                                   | Download CSV file                                          |
| "导入" 按钮 (Import Button)        | API-11                                   | Upload CSV, trigger metadata import                        |
| "关联疾病" 列显示 (Disease Column) | API-08                                   | Match option ID with disease group membership              |
| "类型" 筛选下拉 (Type Filter)      | API-06                                   | Populate dropdown with group names                         |

