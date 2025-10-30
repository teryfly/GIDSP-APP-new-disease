# API Contract 4 – New Case Form (WF-4.4)

## 1. Page Description
Creates a new confirmed-disease case in Program PrgCaseMgt1. The multi-step form captures: Program attributes (disease type, patient demographics, report org/date, symptom onset, diagnosis date, case source) and Investigation stage data (exposure/contact/travel narratives). It supports TEI search/creation (by unique national ID), enrollment creation, auto-generated case number, and an initial non-repeatable Investigation stage event. Draft/save and final submit both persist via Tracker importer.

## 2. Required DHIS2 APIs

| #    | Endpoint                              | Method | Description                                                  | Key Parameters                                               | Expected Response / Data Type                |
| ---- | ------------------------------------- | ------ | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------- |
| 1    | /api/programs/PrgCaseMgt1             | GET    | Load program metadata (attributes, stages, option sets) to render steps | fields=id,name,trackedEntityType[id],programTrackedEntityAttributes[mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,name,options[id,code,name]]]],programStages[id,name,repeatable,sortOrder,programStageDataElements[dataElement[id,name,valueType,optionSet[id,name,options[id,code,name]]]]] | Program                                      |
| 2    | /api/optionSets/{id}                  | GET    | Load option sets if not fully included by API-01             | fields=id,name,options[id,code,name]                         | OptionSet                                    |
| 3    | /api/tracker/trackedEntities          | GET    | Search existing person by unique attribute (AtrNatnlId1) to prevent duplicates; also prefill demographics | trackedEntityType=TetPerson01&orgUnits={ouId}&orgUnitMode=DESCENDANTS&filter=AtrNatnlId1:eq:{nationalId}&fields=trackedEntity,trackedEntityType,orgUnit,attributes[attribute,value]&page=1&pageSize=50 | { pager, trackedEntities[] }                 |
| 4    | /api/tracker/trackedEntities          | GET    | Optional person search by name/phone for assisted find       | trackedEntityType=TetPerson01&orgUnits={ouId}&orgUnitMode=DESCENDANTS&filter=AtrFullNm01:ilike:{name},AtrPhone001:ilike:{phone}&page=1&pageSize=50&fields=trackedEntity,orgUnit,attributes[attribute,value] | { pager, trackedEntities[] }                 |
| 5    | /api/tracker                          | POST   | CREATE flow: create TEI + enrollment + initial Investigation event in one nested payload | importStrategy=CREATE&atomicMode=OBJECT                      | Import summary with created uids             |
| 6    | /api/tracker                          | POST   | UPDATE flow: add enrollment and Investigation event for an existing TEI | importStrategy=CREATE_AND_UPDATE&atomicMode=OBJECT           | Import summary with created enrollment/event |
| 7    | /api/tracker                          | POST   | SAVE DRAFT: create incomplete TEI/enrollment or update attributes/event values during step navigation | importStrategy=CREATE_AND_UPDATE&atomicMode=OBJECT           | Import summary                               |
| 8    | /api/tracker                          | POST   | UPDATE attributes for TEI (e.g., diagnosis date correction)  | importStrategy=UPDATE&atomicMode=OBJECT with trackedEntities[] | Import summary                               |
| 9    | /api/tracker                          | POST   | UPDATE enrollment program attributes (if any configured at enrollment level) | importStrategy=UPDATE&atomicMode=OBJECT with enrollments[] attributes[] | Import summary                               |
| 10   | /api/tracker                          | POST   | UPDATE Investigation stage event data values (exposure/contact/travel; case status) | importStrategy=UPDATE&atomicMode=OBJECT with events[]        | Import summary                               |
| 11   | /api/me                               | GET    | Get current user info to default reporting org unit          | fields=organisationUnits[id,name]                            | User                                         |
| 12   | /api/organisationUnits                | GET    | Resolve selectable org units for Report Org field (capture scope) | filter=path:like:{rootOuId}&fields=id,name,level,parent[id]&paging=false | OrgUnits list                                |
| 13   | /api/tracker/trackedEntities/{teiUid} | GET    | Load created TEI confirmation summary after submit           | program=PrgCaseMgt1&fields=trackedEntity,attributes[attribute,value],enrollments[enrollment,program,status,orgUnit,enrolledAt,events[event,programStage,occurredAt,status]] | TrackedEntity aggregate                      |

## 3. Notes
- Metadata dependencies:
  - Program PrgCaseMgt1; TrackedEntityType TetPerson01.
  - Program attributes used by the form: AtrCaseNo01 (auto-generated), AtrDiseaCd1 (OsDiseasCd1), AtrRptOrg01 (OU), AtrRptDt001 (DATE), AtrSymptDt1 (DATE), AtrDiagDt01 (DATE), AtrCaseSrc1 (OsCaseSrc01), plus demographics AtrFullNm01, AtrNatnlId1 (unique), AtrGender01 (OsGender001), AtrAge00001, AtrPhone001, AtrAddr0001.
  - Investigation (PsInvestig1) data elements: DeCaseStat1 (OsCaseStat1), DeExposHst1, DeContHst01, DeTravHst01, optional DePushEpi01/DePushEpiDt.
- Process:
  - Step 1: Person search (API-3/4). If found, choose existing TEI; else create new.
  - Step 2: Capture program attributes; Step 3: Epidemiology narratives (Investigation stage elements).
  - Submit: Use nested payload (API-5) when TEI is new; or API-6/7 when TEI exists.
- Tracker importer rules:
  - For UPDATE, include non-collection fields for objects in events/enrollments (event, programStage, enrollment, orgUnit, occurredAt, status) when changing dataValues.
  - Generated attributes: AtrCaseNo01 is generated server-side if using attribute with pattern; do not set value in client unless pre-generated via reserved values endpoints (not required here).
- Access/ownership:
  - Program accessLevel=PROTECTED; the owning OU must be within user capture scope. Use orgUnitMode properly in searches. Authority F_TRACKED_ENTITY_INSTANCE_SEARCH required for search.
- Case status:
  - Case status is stored as Investigation stage data element DeCaseStat1; program rules will transition based on subsequent stages.

## 4. Example Request & Response

API-03: 按身份证号查询是否已存在人员（防重）

请求:
GET /api/tracker/trackedEntities?trackedEntityType=TetPerson01&orgUnits=OuChengdu01&orgUnitMode=DESCENDANTS&filter=AtrNatnlId1:eq:110101197901011234&fields=trackedEntity,trackedEntityType,orgUnit,attributes[attribute,value]&page=1&pageSize=50

响应:
{
  "pager": { "page": 1, "pageSize": 50, "total": 1, "pageCount": 1 },
  "trackedEntities": [
    {
      "trackedEntity": "PQfMcpmXeFE",
      "trackedEntityType": "TetPerson01",
      "orgUnit": "OuChengdu01",
      "attributes": [
        { "attribute": "AtrFullNm01", "value": "张三" },
        { "attribute": "AtrNatnlId1", "value": "110101197901011234" },
        { "attribute": "AtrGender01", "value": "MALE" }
      ]
    }
  ]
}

API-05: 新增个案（新建TEI + Enrollment + 调查事件）

请求:
POST /api/tracker?importStrategy=CREATE&atomicMode=OBJECT
Content-Type: application/json

{
  "trackedEntities": [
    {
      "orgUnit": "OuChengdu01",
      "trackedEntityType": "TetPerson01",
      "attributes": [
        { "attribute": "AtrFullNm01", "value": "张三" },
        { "attribute": "AtrNatnlId1", "value": "110101197901011234" },
        { "attribute": "AtrGender01", "value": "MALE" },
        { "attribute": "AtrAge00001", "value": "45" },
        { "attribute": "AtrPhone001", "value": "13800000000" },
        { "attribute": "AtrAddr0001", "value": "北京市朝阳区XX街道XX号" }
      ],
      "enrollments": [
        {
          "program": "PrgCaseMgt1",
          "orgUnit": "OuChengdu01",
          "status": "ACTIVE",
          "enrolledAt": "2024-01-15T00:00:00.000",
          "occurredAt": "2024-01-10T00:00:00.000",
          "attributes": [
            { "attribute": "AtrCaseNo01", "value": "" },
            { "attribute": "AtrDiseaCd1", "value": "OptDiseaB30" },
            { "attribute": "AtrRptOrg01", "value": "OuChengdu01" },
            { "attribute": "AtrRptDt001", "value": "2024-01-15" },
            { "attribute": "AtrSymptDt1", "value": "2024-01-10" },
            { "attribute": "AtrDiagDt01", "value": "2024-01-14" },
            { "attribute": "AtrCaseSrc1", "value": "ACTIVE_SURVEILLANCE" }
          ],
          "events": [
            {
              "program": "PrgCaseMgt1",
              "programStage": "PsInvestig1",
              "orgUnit": "OuChengdu01",
              "status": "ACTIVE",
              "occurredAt": "2024-01-15T14:30:00.000",
              "dataValues": [
                { "dataElement": "DeCaseStat1", "value": "NEW" },
                { "dataElement": "DeExposHst1", "value": "近14天有疫区旅居史" },
                { "dataElement": "DeContHst01", "value": "接触确诊病例" },
                { "dataElement": "DeTravHst01", "value": "1月1日至1月7日前往XX省XX市" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

响应:
{
  "status": "OK",
  "stats": { "created": 3, "updated": 0, "deleted": 0, "ignored": 0, "total": 3 },
  "bundleReport": {
    "typeReportMap": {
      "TRACKED_ENTITY": { "stats": { "created": 1, "total": 1 }, "objectReports": [ { "uid": "Kj6vYde4LHh" } ] },
      "ENROLLMENT": { "stats": { "created": 1, "total": 1 }, "objectReports": [ { "uid": "MNWZ6hnuhSw" } ] },
      "EVENT": { "stats": { "created": 1, "total": 1 }, "objectReports": [ { "uid": "evtInvestig01" } ] }
    }
  }
}

API-06: 已有人员，创建Enrollment与调查事件。当使用 `CREATE_AND_UPDATE` 策略时，如果 enrollment 是新建的，不应提供 `enrollment` UID（应由服务器生成）。

请求:
POST /api/tracker?importStrategy=CREATE_AND_UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "enrollments": [
    {
      "program": "PrgCaseMgt1",
      "trackedEntity": "PQfMcpmXeFE",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "enrolledAt": "2024-01-15T00:00:00.000",
      "occurredAt": "2024-01-10T00:00:00.000",
      "attributes": [
        { "attribute": "AtrDiseaCd1", "value": "OptDiseaB30" },
        { "attribute": "AtrRptOrg01", "value": "OuChengdu01" },
        { "attribute": "AtrRptDt001", "value": "2024-01-15" },
        { "attribute": "AtrSymptDt1", "value": "2024-01-10" },
        { "attribute": "AtrDiagDt01", "value": "2024-01-14" },
        { "attribute": "AtrCaseSrc1", "value": "ACTIVE_SURVEILLANCE" }
      ],
      "events": [
        {
          "program": "PrgCaseMgt1",
          "programStage": "PsInvestig1",
          "orgUnit": "OuChengdu01",
          "status": "ACTIVE",
          "occurredAt": "2024-01-15T14:30:00.000",
          "dataValues": [
            { "dataElement": "DeCaseStat1", "value": "NEW" },
            { "dataElement": "DeExposHst1", "value": "近14天有疫区旅居史" }
          ]
        }
      ]
    }
  ]
}

响应:
{
  "status": "OK",
  "stats": { "created": 2, "updated": 0, "deleted": 0, "ignored": 0, "total": 2 }
}

**注意**：`AtrCaseNo01` 使用 `generated=true` 配置，无需在请求中传递空字符串。



API-10: 更新调查事件（保存草稿/修改）

请求:
POST /api/tracker?importStrategy=UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "events": [
    {
      "event": "evtInvestig01",
      "program": "PrgCaseMgt1",
      "programStage": "PsInvestig1",
      "enrollment": "MNWZ6hnuhSw",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "occurredAt": "2024-01-15T14:30:00.000",
      "dataValues": [
        { "dataElement": "DeCaseStat1", "value": "VERIFIED" },
        { "dataElement": "DeTravHst01", "value": "补充：1月3日经停XX市" }
      ]
    }
  ]
}

响应:
{
  "status": "OK",
  "stats": { "created": 0, "updated": 1, "deleted": 0, "ignored": 0, "total": 1 }
}

API-13: 提交成功后回显个案摘要

请求:
GET /api/tracker/trackedEntities/Kj6vYde4LHh?program=PrgCaseMgt1&fields=trackedEntity,attributes[attribute,value],enrollments[enrollment,program,status,orgUnit,enrolledAt,events[event,programStage,occurredAt,status]]

响应:
{
  "trackedEntity": "Kj6vYde4LHh",
  "attributes": [
    { "attribute": "AtrFullNm01", "value": "张三" },
    { "attribute": "AtrNatnlId1", "value": "110101197901011234" }
  ],
  "enrollments": [
    {
      "enrollment": "MNWZ6hnuhSw",
      "program": "PrgCaseMgt1",
      "status": "ACTIVE",
      "orgUnit": "OuChengdu01",
      "enrolledAt": "2024-01-15T00:00:00.000",
      "events": [
        { "event": "evtInvestig01", "programStage": "PsInvestig1", "occurredAt": "2024-01-15T14:30:00.000", "status": "ACTIVE" }
      ]
    }
  ]
}