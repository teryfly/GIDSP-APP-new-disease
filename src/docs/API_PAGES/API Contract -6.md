

# API Contract 6 – Unknown Case Details with Push Flow (WF-4.6)

## 1. Page Description

Displays a single unknown-cause disease case (Program: PrgUnknown1) with tabs for Basic Information (enrollment attributes), Clinical Symptoms (Stage 1: Registration data), Lab Test Records (Stage 2: repeatable lab tests), and Push Records (tracking push status to case management/emergency/epidemiology systems). The page supports editing registration data, adding/updating lab test events, and triggering the **Push to Case Management** workflow (UC10: Seq-2.2) when status=CONFIRMED. The push flow creates a new enrollment in Program 1 (PrgCaseMgt1) for the same TEI, transferring pathogen/disease data, and marks the unknown case as "已推送".

## 2. Required DHIS2 APIs

| #    | Endpoint                                              | Method | Description                                                  | Key Parameters                                               | Expected Response / Data Type              |
| ---- | ----------------------------------------------------- | ------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------ |
| 1    | `/api/programs/PrgUnknown1`                           | GET    | Load Program 2 metadata (stages, attributes, option sets) for form rendering | `fields=id,name,trackedEntityType[id],programTrackedEntityAttributes[mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,name,options[id,code,name]]]],programStages[id,name,repeatable,programStageDataElements[dataElement[id,name,valueType,optionSet[id,name,options[id,code,name]]]]]` | Program                                    |
| 2    | `/api/programs/PrgCaseMgt1`                           | GET    | Load Program 1 metadata for push validation (disease code mapping) | `fields=id,name,programTrackedEntityAttributes[trackedEntityAttribute[id,name,valueType,optionSet[options[id,code,name]]]]` | Program                                    |
| 3    | `/api/tracker/trackedEntities/{teiUid}`               | GET    | Load TEI with unknown case enrollment and events             | `program=PrgUnknown1&fields=trackedEntity,trackedEntityType,orgUnit,attributes[attribute,value,displayName],enrollments[enrollment,program,status,orgUnit,enrolledAt,occurredAt,attributes[attribute,value],events[event,programStage,occurredAt,status,dataValues[dataElement,value]]]` | TrackedEntity with enrollments/events      |
| 4    | `/api/tracker/events`                                 | GET    | Paginated lab test records (Stage 2: PsLabTest01)            | `program=PrgUnknown1&enrollment={enrollmentUid}&programStage=PsLabTest01&order=occurredAt:desc&page={page}&pageSize={pageSize}&totalPages=true` | { pager, events[] }                        |
| 5    | `/api/tracker/events/{eventUid}`                      | GET    | Load single lab test event for edit form                     | `fields=event,program,programStage,enrollment,orgUnit,occurredAt,status,dataValues[dataElement,value]` | Event                                      |
| 6    | `/api/tracker`                                        | POST   | Create new lab test event (Stage 2)                          | `importStrategy=CREATE&atomicMode=OBJECT` with events[]      | Import summary                             |
| 7    | `/api/tracker`                                        | POST   | Update lab test event data values                            | `importStrategy=UPDATE&atomicMode=OBJECT` with events[] (include non-collection fields) | Import summary                             |
| 8    | `/api/tracker`                                        | POST   | Update registration stage event (Stage 1: PsRegister1) data elements | `importStrategy=UPDATE&atomicMode=OBJECT` with events[]      | Import summary                             |
| 9    | `/api/tracker`                                        | POST   | Update enrollment attributes (report org/date if editable)   | `importStrategy=UPDATE&atomicMode=OBJECT` with enrollments[] | Import summary                             |
| 10   | `/api/tracker`                                        | POST   | **Push to Case Management**: Create new enrollment in Program 1 for same TEI | `importStrategy=CREATE_AND_UPDATE&atomicMode=OBJECT` with nested payload: enrollments[] (Program 1) + events[] (Stage 1: Investigation) | Import summary with created enrollment UID |
| 11   | `/api/tracker`                                        | POST   | **Mark pushed status**: Update Registration stage event flags (DePushCase1=true, DePushCsId1, DePushCsDt1) | `importStrategy=UPDATE&atomicMode=OBJECT` with events[]      | Import summary                             |
| 12   | `/api/tracker`                                        | POST   | **Update unknown status**: Set Registration stage DeUnkStat01=CONFIRMED when lab confirms pathogen | `importStrategy=UPDATE&atomicMode=OBJECT` with events[]      | Import summary                             |
| 13   | `/api/tracker`                                        | POST   | **Complete unknown enrollment**: Set enrollment status=COMPLETED after push | `importStrategy=UPDATE&atomicMode=OBJECT` with enrollments[status=COMPLETED]` | Import summary                             |
| 14   | `/api/tracker/trackedEntities`                        | GET    | Verify if TEI already enrolled in Program 1 to prevent duplicate push | `trackedEntity={teiUid}&program=PrgCaseMgt1&fields=trackedEntity,enrollments[enrollment,program,status]` | TrackedEntity with enrollments             |
| 15   | `/api/tracker/enrollments/{enrollmentUid}/changeLogs` | GET    | Load enrollment-level change logs (Push Records tab)         | `order=createdAt:desc&page={page}&pageSize={pageSize}`       | { pager, changeLogs[] }                    |
| 16   | `/api/tracker/events/{eventUid}/changeLogs`           | GET    | Load event-level change logs (lab test audit)                | `order=createdAt:desc`                                       | { pager, changeLogs[] }                    |

## 3. Notes

### Metadata Dependencies

- Program 2 (PrgUnknown1)

  :

  - Stages: PsRegister1 (registration, non-repeatable), PsLabTest01 (lab test, repeatable)
  - Enrollment attributes: AtrUnkNo001, AtrRptDt001, AtrRptOrg01, AtrSymptDt1, AtrUnkSymp1, AtrUnkPath1
  - Stage 1 data elements: DeUnkStat01 (OsUnkStat01: PENDING_TEST, TESTING, CONFIRMED, EXCLUDED), DePushCase1 (bool), DePushCsId1 (text), DePushCsDt1 (datetime), DePushEmg01, DePushEmgDt, DeUnkPshEpi, DeUnkPshDt1
  - Stage 2 data elements: DeUnkTstNo1, DeUnkSmplDt, DeUnkSmplTp, DeUnkTstTp1, DeUnkTstRst (OsTestRslt1), DeConfPath1 (OsPathogen1), DeConfDis01 (text), DeUnkTstSt1 (OsTestStat1)

- Program 1 (PrgCaseMgt1)

  : Target program for push

  - Enrollment attribute: AtrDiseaCd1 (OsDiseasCd1), AtrCaseSrc1 (must set to "UNKNOWN_CASE_TRANSFER")

### Push Flow (UC10: Seq-2.2) Implementation

1. **Trigger condition** (Program Rule PR7.4): `DeUnkStat01=='CONFIRMED' && DePushCase1!=true`

2. **Pre-validation** (API-14): Check if TEI already enrolled in Program 1 with same disease; if exists, display conflict error.

3. Pathogen-to-Disease Mapping

   :

   - Frontend maintains mapping table: `DeConfPath1` (pathogen option code) → `AtrDiseaCd1` (disease option code)
   - Example: `V103` (SARS-CoV-2) → `B03` (COVID-19)

4. Push transaction

    (APIs 10→11→12→13):

   - **Step 1** (API-10): Create Program 1 enrollment with attributes: `AtrDiseaCd1={mappedDisease}`, `AtrCaseSrc1='UNKNOWN_CASE_TRANSFER'`, `AtrRptDt001={from unknown case}`, `AtrSymptDt1={from unknown case}`. Include nested Investigation stage event with `DeCaseStat1='NEW'` and copy clinical symptoms to `DeInitDiag` or notes.
   - **Step 2** (API-11): Update Program 2 Registration event: `DePushCase1=true`, `DePushCsId1={created enrollment UID}`, `DePushCsDt1={now}`
   - **Step 3** (API-12): Update Program 2 Registration event: `DeUnkStat01='CONFIRMED'` (if not already)
   - **Step 4** (API-13): Mark Program 2 enrollment as `COMPLETED`

5. **Error handling**: If API-10 fails, rollback is not automatic (atomicMode=OBJECT); display error and do not proceed to API-11/12/13.

### UI Flow

- **Push button visibility**: Show "推送至个案管理" when `DeUnkStat01=='CONFIRMED' && DePushCase1!=true`
- **Push confirmation dialog**: Display summary (patient, pathogen, mapped disease) + warnings (irreversible)
- **Push progress modal**: Show steps 1-4 with loading/success/error states
- **Push success**: Show success message with link to new case details (navigate to WF-4.3 with new enrollment UID)
- **Push records tab**: Display push history from change logs (API-15/16) + parse `DePushCsId1` to show destination case link

### Tracker Importer Rules

- For UPDATE operations (APIs 7/8/9/11/12), include all non-collection fields: `event/enrollment, program, programStage, orgUnit, status, occurredAt/enrolledAt`
- For nested create (API-10), enrollment UID should not be provided (server generates); event UID also omitted
- Use `importStrategy=CREATE_AND_UPDATE` when mixing creates and updates in same payload

### Access Control

- Program 2 accessLevel=PROTECTED; ownership must be within user capture scope
- Authority `F_ENROLLMENT_CASCADE_DELETE` required to complete enrollment (API-13) only if it has undeleted events
- For push (API-10), user must have write access to Program 1 and target orgUnit must be in capture scope

### Performance Considerations

- Cache API-1/2 metadata responses (rarely change)
- Use API-4 with pagination for lab test list; API-3 includes events but may be truncated if many records
- API-14 check before push to avoid duplicate enrollment errors

## 4. Example Request & Response

### API-03: 获取不明原因病例详情（TEI+Enrollment+Events）

**请求:**

```http
GET /api/tracker/trackedEntities/UN810PwyVYO?program=PrgUnknown1&fields=trackedEntity,trackedEntityType,orgUnit,attributes[attribute,value,displayName],enrollments[enrollment,program,status,orgUnit,enrolledAt,occurredAt,attributes[attribute,value],events[event,programStage,occurredAt,status,dataValues[dataElement,value]]]
```

**响应:**

```json
{
  "trackedEntity": "UN810PwyVYO",
  "trackedEntityType": "TetPerson01",
  "orgUnit": "OuChengdu01",
  "attributes": [
    { "attribute": "AtrFullNm01", "displayName": "姓名", "value": "王五" },
    { "attribute": "AtrNatnlId1", "displayName": "身份证号", "value": "110101198601011234" }
  ],
  "enrollments": [
    {
      "enrollment": "f3rg8gFag8j",
      "program": "PrgUnknown1",
      "status": "ACTIVE",
      "orgUnit": "OuChengdu01",
      "enrolledAt": "2024-01-13T00:00:00.000",
      "occurredAt": "2024-01-08T00:00:00.000",
      "attributes": [
        { "attribute": "AtrUnkNo001", "value": "UNK-20240113-0021" },
        { "attribute": "AtrRptDt001", "value": "2024-01-13" },
        { "attribute": "AtrRptOrg01", "value": "OuChengdu01" },
        { "attribute": "AtrSymptDt1", "value": "2024-01-08" },
        { "attribute": "AtrUnkSymp1", "value": "发热、咳嗽、乏力，不明原因肺炎" },
        { "attribute": "AtrUnkPath1", "value": "疑似新型冠状病毒" }
      ],
      "events": [
        {
          "event": "evReg0021",
          "programStage": "PsRegister1",
          "occurredAt": "2024-01-13T10:20:00.000",
          "status": "ACTIVE",
          "dataValues": [
            { "dataElement": "DeUnkStat01", "value": "CONFIRMED" },
            { "dataElement": "DePushCase1", "value": "false" },
            { "dataElement": "DePushEmg01", "value": "false" },
            { "dataElement": "DeUnkPshEpi", "value": "false" }
          ]
        },
        {
          "event": "evLab0009",
          "programStage": "PsLabTest01",
          "occurredAt": "2024-01-15T09:00:00.000",
          "status": "ACTIVE",
          "dataValues": [
            { "dataElement": "DeUnkTstNo1", "value": "UNKTEST-20240115-0089" },
            { "dataElement": "DeUnkSmplDt", "value": "2024-01-14" },
            { "dataElement": "DeUnkSmplTp", "value": "THROAT_SWAB" },
            { "dataElement": "DeUnkTstTp1", "value": "NAT" },
            { "dataElement": "DeUnkTstRst", "value": "POSITIVE" },
            { "dataElement": "DeConfPath1", "value": "OptPathV103" },
            { "dataElement": "DeConfDis01", "value": "新型冠状病毒肺炎" },
            { "dataElement": "DeUnkTstSt1", "value": "CONFIRMED" }
          ]
        }
      ]
    }
  ]
}
```

### API-10: 推送至个案管理（创建Program 1 Enrollment + Investigation Event）

**请求:**

```http
POST /api/tracker?importStrategy=CREATE_AND_UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "enrollments": [
    {
      "program": "PrgCaseMgt1",
      "trackedEntity": "UN810PwyVYO",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "enrolledAt": "2024-01-15T00:00:00.000",
      "occurredAt": "2024-01-08T00:00:00.000",
      "attributes": [
        { "attribute": "AtrDiseaCd1", "value": "OptDiseaB30" },
        { "attribute": "AtrCaseSrc1", "value": "OptUnkTran1" },
        { "attribute": "AtrRptDt001", "value": "2024-01-13" },
        { "attribute": "AtrSymptDt1", "value": "2024-01-08" },
        { "attribute": "AtrRptOrg01", "value": "OuChengdu01" }
      ],
      "events": [
        {
          "program": "PrgCaseMgt1",
          "programStage": "PsInvestig1",
          "orgUnit": "OuChengdu01",
          "status": "ACTIVE",
          "occurredAt": "2024-01-15T10:00:00.000",
          "dataValues": [
            { "dataElement": "DeCaseStat1", "value": "OptNew00001" },
            { "dataElement": "DeInitDiag", "value": "不明原因肺炎，已确诊新型冠状病毒感染" }
          ]
        }
      ]
    }
  ]
}
```

**响应:**

```json
{
  "status": "OK",
  "stats": { "created": 2, "updated": 0, "deleted": 0, "ignored": 0, "total": 2 },
  "bundleReport": {
    "typeReportMap": {
      "ENROLLMENT": {
        "stats": { "created": 1, "total": 1 },
        "objectReports": [ { "trackerType": "ENROLLMENT", "uid": "newEnrCas001", "errorReports": [] } ]
      },
      "EVENT": {
        "stats": { "created": 1, "total": 1 },
        "objectReports": [ { "trackerType": "EVENT", "uid": "newEvtInv001", "errorReports": [] } ]
      }
    }
  }
}
```

### API-11: 标记已推送（更新Registration事件）

**请求:**

```http
POST /api/tracker?importStrategy=UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "events": [
    {
      "event": "evReg0021",
      "program": "PrgUnknown1",
      "programStage": "PsRegister1",
      "enrollment": "f3rg8gFag8j",
      "orgUnit": "OuChengdu01",
      "status": "ACTIVE",
      "occurredAt": "2024-01-13T10:20:00.000",
      "dataValues": [
        { "dataElement": "DePushCase1", "value": "true" },
        { "dataElement": "DePushCsId1", "value": "newEnrCas001" },
        { "dataElement": "DePushCsDt1", "value": "2024-01-15T10:01:00.000" }
      ]
    }
  ]
}
```

**响应:**

```json
{
  "status": "OK",
  "stats": { "created": 0, "updated": 1, "deleted": 0, "ignored": 0, "total": 1 }
}
```

### API-13: 完成不明病例Enrollment

**请求:**

```http
POST /api/tracker?importStrategy=UPDATE&atomicMode=OBJECT
Content-Type: application/json

{
  "enrollments": [
    {
      "enrollment": "f3rg8gFag8j",
      "program": "PrgUnknown1",
      "trackedEntity": "UN810PwyVYO",
      "orgUnit": "OuChengdu01",
      "status": "COMPLETED",
      "enrolledAt": "2024-01-13T00:00:00.000",
      "occurredAt": "2024-01-08T00:00:00.000",
      "completedAt": "2024-01-15T10:02:00.000"
    }
  ]
}
```

**响应:**

```json
{
  "status": "OK",
  "stats": { "created": 0, "updated": 1, "deleted": 0, "ignored": 0, "total": 1 }
}
```

### API-14: 推送前检查TEI是否已在Program 1中有同类型疾病的Enrollment

**请求:**

```http
GET /api/tracker/trackedEntities/UN810PwyVYO?program=PrgCaseMgt1&fields=trackedEntity,enrollments[enrollment,program,status,attributes[attribute,value]]
```

**响应 (无冲突):**

```json
{
  "trackedEntity": "UN810PwyVYO",
  "enrollments": []
}
```

**响应 (有冲突):**

```json
{
  "trackedEntity": "UN810PwyVYO",
  "enrollments": [
    {
      "enrollment": "existingEnr001",
      "program": "PrgCaseMgt1",
      "status": "ACTIVE",
      "attributes": [
        { "attribute": "AtrDiseaCd1", "value": "OptDiseaB30" }
      ]
    }
  ]
}
```

*如果发现相同疾病的活跃Enrollment，前端应阻止推送并提示"该患者已存在新冠肺炎个案记录(CASE-XXXX)，请勿重复推送"。*

------

