# API Contract 3 – Case Details (WF-4.3)

## 1. Page Description
Displays a single confirmed disease case (Program: PrgCaseMgt1) with enrollment context and stage data. Tabs load: Basic Information (Program attributes + Stage 1: Investigation data elements), Epidemiology narrative (Stage 1 long text fields), Follow-up records (Stage 2 repeatable events), Treatment records (Stage 3 repeatable events), Test records (Stage 4 repeatable events), Tracking records (Stage 5 repeatable events), and Operation Logs (change logs). Page supports: edit case attributes, add/update repeatable stage events, push to epidemiology system flags, and close case (status changes via program rules/data element updates).

## 2. Required DHIS2 APIs

| #    | Endpoint                                         | Method | Description                                                  | Key Parameters                                               | Expected Response / Data Type               |
| ---- | ------------------------------------------------ | ------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------- |
| 1    | /api/programs/PrgCaseMgt1                        | GET    | Load program metadata, stages, and attributes to render tabs and forms | fields=id,name,trackedEntityType[id],programTrackedEntityAttributes[mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,name,options[id,code,name]]]],programStages[id,name,repeatable,programStageDataElements[dataElement[id,name,valueType,optionSet[id,name,options[id,code,name]]]]] | Program                                     |
| 2    | /api/optionSets/{id}                             | GET    | Resolve option sets for dropdowns (if not included by API-01 or for caching) | fields=id,name,options[id,code,name]                         | OptionSet                                   |
| 3    | /api/tracker/trackedEntities/{teiUid}            | GET    | Load TEI with enrollments and events for this program        | program=PrgCaseMgt1&fields=trackedEntity,trackedEntityType,orgUnit,attributes[attribute,value,displayName,valueType],enrollments[enrollment,program,status,orgUnit,enrolledAt,occurredAt,attributes[attribute,value],events[event,programStage,occurredAt,status,orgUnit,dataValues[dataElement,value]]] | TrackedEntity with nested Enrollment+Events |
| 4    | /api/tracker/enrollments/{enrollmentUid}         | GET    | Load single enrollment details when deep-linking or refreshing one tab | fields=*,!relationships,!events,!attributes                  | Enrollment                                  |
| 5    | /api/tracker/events                              | GET    | Load paginated repeatable events per stage tab (follow-up/treatment/test/tracking) | program=PrgCaseMgt1&enrollment={enrollmentUid}&programStage={stageUid}&order=occurredAt:desc&page={page}&pageSize={pageSize} | { pager, events[] }                         |
| 6    | /api/tracker/events/{eventUid}                   | GET    | Load a single event for edit form                            | fields=event,program,programStage,enrollment,orgUnit,occurredAt,status,dataValues[dataElement,value] | Event                                       |
| 7    | /api/tracker                                     | POST   | Create a new repeatable event (Stage 2/3/4/5)                | importStrategy=CREATE&atomicMode=OBJECT with payload events[] | Import summary                              |
| 8    | /api/tracker                                     | POST   | Update an event’s data values or status                      | importStrategy=UPDATE&atomicMode=OBJECT with payload events[] (include non-collection fields) | Import summary                              |
| 9    | /api/tracker                                     | POST   | Update TEI attributes in context of case (program attributes on TEI/enrollment as designed) | importStrategy=UPDATE&atomicMode=OBJECT with payload trackedEntities[] or enrollments[] attributes[] | Import summary                              |
| 10   | /api/tracker                                     | POST   | Mark push-to-epidemiology flags on Investigation stage event | importStrategy=UPDATE&atomicMode=OBJECT with payload events[] dataValues[dataElement=DePushEpi01,DePushEpiDt] | Import summary                              |
| 11   | /api/tracker                                     | POST   | Close case by setting Case Status in Stage 1 event (program rules may react) | importStrategy=UPDATE&atomicMode=OBJECT with payload events[] dataValues[dataElement=DeCaseStat1,value='CLOSED'] | Import summary                              |
| 12   | /api/tracker/events/{eventUid}/changeLogs        | GET    | Load audit trail for event fields/data values (Operations Log tab) | order=createdAt:desc                                         | { pager, changeLogs[] }                     |
| 13   | /api/tracker/trackedEntities/{teiUid}/changeLogs | GET    | Load audit trail for TEI attribute changes (Operations Log tab) | program=PrgCaseMgt1&order=createdAt:desc                     | { pager, changeLogs[] }                     |
| 14   | /api/tracker/events                              | GET    | Filtered fetch for specific status or date range per tab     | program=PrgCaseMgt1&enrollment={enrollmentUid}&programStage={stageUid}&occurredAfter={from}&occurredBefore={to}&status={status} | { pager, events[] }                         |
| 15   | /api/tracker/events/{eventUid}                   | GET    | Fetch latest single Investigation stage event to display epidemiology texts (exposure/contact/travel) | fields=event,occurredAt,dataValues[dataElement,value]        | Event                                       |

## 3. Notes
- Inter-API dependencies:
  - API-01 should be loaded once and cached; it defines stage UIDs: PsInvestig1 (Investigation), PsFollowUp1, PsTreatmnt1, PsTest00001, PsTracking1; and data elements including DeCaseStat1, DeExposHst1, DeContHst01, DeTravHst01, DePushEpi01, DePushEpiDt etc.
  - API-03 is the primary load for the page header and Basic/Epidemiology tabs; it returns TEI attributes (e.g., AtrCaseNo01, AtrFullNm01, AtrDiseaCd1, AtrRptDt001) and the enrollment with nested events for the program.
  - Tabs with many events (follow-up, treatment, test, tracking) should use API-05 with pagination rather than relying solely on nested events in API-03.
- Filtering/pagination:
  - For list tabs use page/pageSize and order=occurredAt:desc; set totalPages=true when rendering pagers.
  - For date filters per tab, use occurredAfter/occurredBefore; for status filters use status parameter.
- Update semantics (Tracker v2.41):
  - For updates via /api/tracker (API-08/09/10/11), include object non-collection fields (e.g., event, enrollment, orgUnit, programStage, occurredAt, status) even when only changing dataValues, per tracker importer requirements.
  - To update TEI attributes owned by TEI, use trackedEntities[]; to update program attributes owned by enrollment, use enrollments[] attributes[] with enrollment UID.
- Security and scopes:
  - Reading/updating requires access to Program PrgCaseMgt1 (accessLevel=PROTECTED) and ownership within user capture scope; otherwise use break-the-glass flow outside this page (not covered).
- Option sets:
  - Disease code options (OsDiseasCd1), Case Status (OsCaseStat1), and others are available through API-01; only call API-02 if lazy-loading or cache-miss.
- Status changes:
  - Case closure is effected by writing DeCaseStat1='CLOSED' on the Investigation stage event (API-11). Program rules may also update via other stages.

## 4. Example Request & Response

API-03: 获取个案详情（TEI+Enrollment+Events）

[请求地址]
GET /api/tracker/trackedEntities/PQfMcpmXeFE?program=PrgCaseMgt1&fields=trackedEntity,trackedEntityType,orgUnit,attributes[attribute,value,displayName,valueType],enrollments[enrollment,program,status,orgUnit,enrolledAt,occurredAt,attributes[attribute,value],events[event,programStage,occurredAt,status,orgUnit,dataValues[dataElement,value]]]

[返回消息体]
{
  "trackedEntity": "PQfMcpmXeFE",
  "trackedEntityType": "TetPerson01",
  "orgUnit": "OuChengdu01",
  "attributes": [
    { "attribute": "AtrCaseNo01", "displayName": "个案编号", "value": "CASE-20240115-0156" },
    { "attribute": "AtrFullNm01", "displayName": "姓名", "value": "张三" },
    { "attribute": "AtrDiseaCd1", "displayName": "疾病编码", "value": "OptDiseaB30" },
    { "attribute": "AtrRptDt001", "displayName": "报告日期", "value": "2024-01-15" }
  ],
  "enrollments": [
    {
      "enrollment": "MNWZ6hnuhSw",
      "program": "PrgCaseMgt1",
      "status": "ACTIVE",
      "orgUnit": "OuChengdu01",
      "enrolledAt": "2024-01-15T00:00:00.000",
      "events": [
        {
          "event": "evtInvestig01",
          "programStage": "PsInvestig1",
          "occurredAt": "2024-01-15T14:30:00.000",
          "status": "ACTIVE",
          "orgUnit": "OuChengdu01",
          "dataValues": [
            { "dataElement": "DeCaseStat1", "value": "VERIFIED" },
            { "dataElement": "DeExposHst1", "value": "近14天内有疫区旅居史..." },
            { "dataElement": "DeContHst01", "value": "与确诊病例有密切接触..." },
            { "dataElement": "DeTravHst01", "value": "1月1日至1月7日前往XX市..." },
            { "dataElement": "DePushEpi01", "value": "false" }
          ]
        }
      ]
    }
  ]
}

API-05: 分页获取随访记录（Stage 2）

[请求地址]
GET /api/tracker/events?program=PrgCaseMgt1&enrollment=MNWZ6hnuhSw&programStage=PsFollowUp1&order=occurredAt:desc&page=1&pageSize=10&totalPages=true

[返回消息体]
{
  "pager": { "page": 1, "pageSize": 10, "total": 23, "pageCount": 3 },
  "events": [
    {
      "event": "evFlw001",
      "program": "PrgCaseMgt1",
      "programStage": "PsFollowUp1",
      "enrollment": "MNWZ6hnuhSw",
      "orgUnit": "OuChengdu01",
      "occurredAt": "2024-01-15T00:00:00.000",
      "status": "ACTIVE",
      "dataValues": [
        { "dataElement": "DeFlwUpMthd", "value": "PHONE" },
        { "dataElement": "DeHlthStat1", "value": "NORMAL" },
        { "dataElement": "DeTemp00001", "value": "36.8" },
        { "dataElement": "DeSymptoms1", "value": "咳嗽减轻，无发热" },
        { "dataElement": "DeTrtCompl1", "value": "GOOD" },
        { "dataElement": "DeNxtFlwDt1", "value": "2024-01-18" }
      ]
    }
  ]
}

API-07: 新增检测记录（Stage 4）

[请求地址]
POST /api/tracker?importStrategy=CREATE&atomicMode=OBJECT
Content-Type: application/json

{
  "events": [
    {
      "program": "PrgCaseMgt1",
      "programStage": "PsTest00001",
      "enrollment": "MNWZ6hnuhSw",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "occurredAt": "2024-01-16T09:00:00.000",
      "dataValues": [
        { "dataElement": "DeTestNo001", "value": "TEST-20240116-0101" },
        { "dataElement": "DeSmplColDt", "value": "2024-01-15" },
        { "dataElement": "DeSmplType1", "value": "THROAT_SWAB" },
        { "dataElement": "DeTestType1", "value": "NAT" },
        { "dataElement": "DeTestRslt1", "value": "POSITIVE" },
        { "dataElement": "DeTestStat1", "value": "CONFIRMED" }
      ]
    }
  ]
}

[返回消息体]
{
  "status": "OK",
  "stats": { "created": 1, "updated": 0, "deleted": 0, "ignored": 0, "total": 1 },
  "bundleReport": {
    "typeReportMap": {
      "EVENT": {
        "stats": { "created": 1, "updated": 0, "deleted": 0, "ignored": 0, "total": 1 },
        "objectReports": [ { "trackerType": "EVENT", "uid": "evTest001", "errorReports": [] } ]
      }
    }
  }
}

API-10: 标记推送至流调系统（调查阶段事件）

[请求地址]
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
        { "dataElement": "DePushEpi01", "value": "true" },
        { "dataElement": "DePushEpiDt", "value": "2024-01-16T09:30:00.000" }
      ]
    }
  ]
}

[返回消息体]
{
  "status": "OK",
  "stats": { "created": 0, "updated": 1, "deleted": 0, "ignored": 0, "total": 1 }
}

API-11: 结案（设置个案状态为已关闭）

[请求地址]
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
        { "dataElement": "DeCaseStat1", "value": "CLOSED" }
      ]
    }
  ]
}

[返回消息体]
{
  "status": "OK",
  "stats": { "created": 0, "updated": 1, "deleted": 0, "ignored": 0, "total": 1 }
}

API-12: 获取事件变更日志（操作日志Tab）

[请求地址]
GET /api/tracker/events/evtInvestig01/changeLogs?order=createdAt:desc

[返回消息体]
{
  "pager": { "page": 1, "pageSize": 10 },
  "changeLogs": [
    {
      "createdBy": { "uid": "UserChgd001", "username": "chengdu_cdc_001" },
      "createdAt": "2024-01-16T09:30:10.000",
      "type": "UPDATE",
      "change": { "dataValue": { "dataElement": "DeCaseStat1", "previousValue": "VERIFIED", "currentValue": "CLOSED" } }
    }
  ]
}

API-09: 更新个案属性（如确诊日期 AtrDiagDt01）

[请求地址]
POST /api/tracker?importStrategy=UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "enrollments": [
    {
      "enrollment": "MNWZ6hnuhSw",
      "program": "PrgCaseMgt1",
      "trackedEntity": "PQfMcpmXeFE",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "enrolledAt": "2024-01-15T00:00:00.000",
      "attributes": [
        { "attribute": "AtrDiagDt01", "value": "2024-01-14" }
      ]
    }
  ]
}

[返回消息体]
{
  "status": "OK",
  "stats": { "created": 0, "updated": 1, "deleted": 0, "ignored": 0, "total": 1 }
}