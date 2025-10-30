# API Contract – 首页工作台 (WF-4.1)

## 1. Page Description

首页工作台是疾控业务人员登录系统后的默认页面，提供关键业务指标概览、待办事项提醒、最近访问记录和快捷入口。页面分为四个主要区域：(1) 关键指标卡片（本月新增个案、待核实个案、处理中个案、本月预警事件），(2) 待办事项列表（待核实个案、待确认检测、待处理预警），(3) 最近访问记录，(4) 快捷操作入口。该页面需要聚合多个 Program 和 Analytics 数据源。

------

## 2. Required DHIS2 APIs

| #    | Endpoint                                       | Method   | Description                    | Key Parameters                                               | Expected Response / Data Type      |
| ---- | ---------------------------------------------- | -------- | ------------------------------ | ------------------------------------------------------------ | ---------------------------------- |
| 1    | `/api/analytics/enrollments/query/PrgCaseMgt1` | GET      | 获取本月新增个案数（含趋势）   | `dimension=ou:USER_ORGUNIT;LEVEL-1,pe:THIS_MONTH;LAST_MONTH&outputType=ENROLLMENT` | Analytics聚合数据                  |
| 2    | `/api/trackedEntityInstances`                  | GET      | 获取待核实个案列表（状态=NEW） | `ou={userOrgUnit}&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStatus=ACTIVE&pageSize=3&fields=trackedEntityInstance,attributes,enrollments[enrollment,events[dataValues]]` | TrackedEntityInstanceList（前3条） |
| 3    | `/api/trackedEntityInstances`                  | GET      | 获取处理中个案数               | `ou={userOrgUnit}&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStatus=ACTIVE&paging=false&fields=none` | 仅用于统计count                    |
| 4    | `/api/trackedEntityInstances`                  | GET      | 获取本月预警事件数             | `ou={userOrgUnit}&ouMode=DESCENDANTS&program=PrgAlertMgt1&enrollmentEnrolledAfter={thisMonthStart}&enrollmentEnrolledBefore={thisMonthEnd}&fields=none` | 仅用于统计count                    |
| 5    | `/api/events`                                  | GET      | 获取待确认检测记录（前5条）    | `orgUnit={userOrgUnit}&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStage=PsTest00001&filter=DeTestStat1:EQ:PENDING_CONFIRMATION&pageSize=5&fields=event,eventDate,enrollment,dataValues` | EventList                          |
| 6    | `/api/dataStore/userActivity/{userId}`         | GET      | 获取当前用户最近访问记录       | -                                                            | JSON对象（自定义格式）             |
| 7    | `/api/me`                                      | GET      | 获取当前用户信息               | `fields=id,username,organisationUnits[id,name,level]`        | User对象                           |
| 8    | `/api/dataStore/userActivity/{userId}`         | POST/PUT | 记录用户访问行为（页面埋点）   | -                                                            | `{ "httpStatus": "OK" }`           |

------

## 3. Notes

### 3.1 API 调用顺序与依赖关系

```
页面加载阶段：
  API-07 (当前用户信息) 
    └─> 并行请求：
        ├─> API-01 (本月新增个案数)
        ├─> API-02 (待核实个案列表)
        ├─> API-03 (处理中个案数)
        ├─> API-04 (本月预警事件数)
        ├─> API-05 (待确认检测记录)
        └─> API-06 (最近访问记录)

用户交互阶段：
  [点击卡片/待办项] 
    └─> 跳转至目标页面
    └─> API-08 (记录访问行为)
```

### 3.2 关键技术说明

#### 3.2.1 关键指标计算

**指标1: 本月新增个案数（含趋势）**

使用 DHIS2 Analytics API 按时间维度聚合 Enrollment 数据：

```javascript
// 请求参数
dimension=ou:USER_ORGUNIT;LEVEL-1  // 用户机构及其下级
         &pe:THIS_MONTH;LAST_MONTH    // 本月和上月
         &outputType=ENROLLMENT         // 按Enrollment计数

// 响应数据结构
{
  "rows": [
    ["OuWuhou0001", "202410", "156"],  // 本月
    ["OuWuhou0001", "202409", "136"]   // 上月
  ]
}

// 前端计算趋势
const thisMonth = rows.find(r => r[1] === '202410')[2]; // 156
const lastMonth = rows.find(r => r[1] === '202409')[2]; // 136
const trend = ((thisMonth - lastMonth) / lastMonth * 100).toFixed(0); // +15%
```

**指标2: 待核实个案数**

通过 API-02 返回的 `pager.total` 获取总数：

```javascript
// 请求仅返回分页信息，不返回具体数据
GET /api/trackedEntityInstances?...&pageSize=1&fields=none

// 响应
{
  "pager": {
    "total": 3  // 待核实个案数
  }
}
```

但需要结合 Event 级别的 `DeCaseStat1` 过滤，由于 DHIS2 限制，需要：

**方法A（推荐）：** 前端过滤

```javascript
// 1. 获取所有活跃个案（不分页）
GET /api/trackedEntityInstances?...&paging=false&fields=enrollments[events[dataValues]]

// 2. 前端过滤
const pendingCases = data.filter(tei => {
  const investigationEvent = tei.enrollments[0].events.find(e => e.programStage === 'PsInvestig1');
  return investigationEvent?.dataValues.find(dv => dv.dataElement === 'DeCaseStat1')?.value === 'NEW';
});
```

**方法B：** 使用 DHIS2 Event Reports API（适合大数据量）

```javascript
GET /api/analytics/events/query/PrgCaseMgt1?dimension=DeCaseStat1&filter=DeCaseStat1:EQ:NEW&aggregationType=COUNT
```

**指标3: 处理中个案数**

同指标2，过滤条件改为 `DeCaseStat1:EQ:IN_PROGRESS`

**指标4: 本月预警事件数**

假设系统有独立的"预警管理"Program（`PrgAlertMgt1`），通过 Enrollment 时间范围过滤：

```javascript
GET /api/trackedEntityInstances?program=PrgAlertMgt1
  &enrollmentEnrolledAfter=2024-10-01
  &enrollmentEnrolledBefore=2024-10-31
  &paging=false
  &fields=none

// 从 pager.total 获取数量
```

**注意：** 根据设计文档，预警管理未映射到独立 Program，可能需要通过外部系统 API 或 DataStore 获取。

#### 3.2.2 待办事项数据获取

**待办项1: 待核实个案（前3条）**

```javascript
GET /api/trackedEntityInstances?
  ou={userOrgUnit}&
  ouMode=DESCENDANTS&
  program=PrgCaseMgt1&
  programStatus=ACTIVE&
  pageSize=100&  // 先获取足够多的数据
  fields=trackedEntityInstance,attributes[attribute,value],enrollments[enrollment,enrollmentDate,attributes[attribute,value],events[event,programStage,dataValues[dataElement,value]]]

// 前端过滤出状态=NEW的前3条
const pendingCases = data.trackedEntityInstances
  .filter(tei => {
    const event = tei.enrollments[0].events.find(e => e.programStage === 'PsInvestig1');
    return event?.dataValues.find(dv => dv.dataElement === 'DeCaseStat1')?.value === 'NEW';
  })
  .slice(0, 3);
```

**待办项2: 待确认检测记录（前5条）**

使用 DHIS2 Event API 直接查询：

```javascript
GET /api/events?
  orgUnit={userOrgUnit}&
  ouMode=DESCENDANTS&
  program=PrgCaseMgt1&
  programStage=PsTest00001&
  filter=DeTestStat1:EQ:PENDING_CONFIRMATION&
  pageSize=5&
  order=eventDate:desc&
  fields=event,eventDate,enrollment,orgUnitName,dataValues[dataElement,value]
```

**待办项3: 待处理预警（前2条）**

假设预警数据存储在独立 Program 或外部系统，需要根据实际架构调整：

**方案A：** 预警存储在 DHIS2 Program

```javascript
GET /api/trackedEntityInstances?
  program=PrgAlertMgt1&
  filter=AlertStatus:EQ:PENDING&
  pageSize=2
```

**方案B：** 预警存储在 DataStore

```javascript
GET /api/dataStore/alerts/pending?fields=.
```

**方案C：** 预警由外部系统提供

```javascript
// 调用自定义 API（非 DHIS2）
GET /api/external/alerts/pending?limit=2
```

#### 3.2.3 最近访问记录实现

DHIS2 原生不支持用户行为跟踪，需要使用 **DataStore** 自定义实现：

**数据结构设计：**

```json
// Namespace: userActivity
// Key: {userId}
{
  "recentVisits": [
    {
      "type": "case",           // 资源类型: case/alert/report
      "id": "TEI123456",        // 资源ID
      "title": "CAS-2024-156",  // 显示标题
      "url": "/case/TEI123456", // 跳转URL
      "timestamp": "2024-10-30T10:30:00Z"
    },
    {
      "type": "case",
      "id": "TEI123450",
      "title": "CAS-2024-150",
      "url": "/case/TEI123450",
      "timestamp": "2024-10-30T09:15:00Z"
    }
    // ... 最多保存10条
  ]
}
```

**API-06 实现：**

```javascript
GET /api/dataStore/userActivity/UserWuhou01
```

**API-08 实现（页面埋点）：**

```javascript
// 用户访问个案详情页时触发
POST /api/dataStore/userActivity/UserWuhou01
Content-Type: application/json

{
  "recentVisits": [
    {
      "type": "case",
      "id": "TEI123456",
      "title": "CAS-2024-156",
      "url": "/case/TEI123456",
      "timestamp": "2024-10-30T14:20:00Z"
    }
    // ... 合并现有记录，保留最新10条
  ]
}
```

**注意：** 首次使用需创建 Namespace：

```javascript
POST /api/dataStore/userActivity
Content-Type: application/json

{
  "UserWuhou01": {
    "recentVisits": []
  }
}
```

#### 3.2.4 快捷入口配置

快捷入口通常为静态配置（前端硬编码），无需 API 支持：

```javascript
const quickActions = [
  { label: '新增个案', icon: '➕', url: '/case/new' },
  { label: '新增不明病例', icon: '➕', url: '/unknown/new' },
  { label: '疾病统计', icon: '📊', url: '/statistics/disease' },
  { label: '导出报告', icon: '📥', url: '/export/report' }
];
```

若需动态配置（基于用户角色），可使用 DataStore：

```javascript
GET /api/dataStore/systemConfig/quickActions
```

### 3.3 性能优化策略

1. **并行请求：** API-01 至 API-06 使用 `Promise.all()` 并行执行
2. 数据缓存：
   - 关键指标数据缓存 5 分钟（使用 `localStorage` + 时间戳）
   - 最近访问记录缓存至页面卸载
3. **懒加载：** 待办事项列表支持"加载更多"，避免一次性获取所有数据
4. **轮询更新：** 每 30 秒轮询 API-02/API-05，更新待办数量（使用 WebSocket 更优）

### 3.4 数据刷新机制

```javascript
// 页面加载时
useEffect(() => {
  fetchDashboardData();
}, []);

// 定时刷新（可选）
useEffect(() => {
  const interval = setInterval(() => {
    fetchPendingItems(); // 仅刷新待办事项
  }, 30000); // 30秒

  return () => clearInterval(interval);
}, []);

// 手动刷新
const handleRefresh = () => {
  fetchDashboardData({ forceRefresh: true });
};
```

------

## 4. Example Request & Response

### API-01: 获取本月新增个案数（含趋势）

**请求地址**

```
GET http://[基地址]/api/analytics/enrollments/query/PrgCaseMgt1?dimension=ou:USER_ORGUNIT;LEVEL-1&dimension=pe:THIS_MONTH;LAST_MONTH&outputType=ENROLLMENT
```

**返回消息体**

```json
{
  "headers": [
    {
      "name": "ou",
      "column": "Organisation unit",
      "type": "java.lang.String",
      "hidden": false,
      "meta": true
    },
    {
      "name": "pe",
      "column": "Period",
      "type": "java.lang.String",
      "hidden": false,
      "meta": true
    },
    {
      "name": "value",
      "column": "Value",
      "type": "java.lang.Long",
      "hidden": false,
      "meta": false
    }
  ],
  "rows": [
    ["OuWuhou0001", "202410", "156"],
    ["OuWuhou0001", "202409", "136"]
  ],
  "width": 3,
  "height": 2
}
```

**前端数据处理：**

```javascript
const thisMonth = rows.find(r => r[1] === '202410')?.[2] || 0; // 156
const lastMonth = rows.find(r => r[1] === '202409')?.[2] || 0; // 136
const trend = lastMonth > 0 
  ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(0) 
  : 0; // +15%
const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
```

------

### API-02: 获取待核实个案列表（前3条）

**请求地址**

```
GET http://[基地址]/api/trackedEntityInstances?ou=OuWuhou0001&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStatus=ACTIVE&pageSize=100&fields=trackedEntityInstance,attributes[attribute,value],enrollments[enrollment,enrollmentDate,attributes[attribute,value],events[event,programStage,eventDate,dataValues[dataElement,value]]]&order=created:desc
```

**返回消息体**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 100,
    "total": 25
  },
  "trackedEntityInstances": [
    {
      "trackedEntityInstance": "TEI123456",
      "attributes": [
        {
          "attribute": "AtrCaseNo01",
          "value": "CASE-20241030-0012"
        },
        {
          "attribute": "AtrFullNm01",
          "value": "李四"
        }
      ],
      "enrollments": [
        {
          "enrollment": "ENROLLMENT_789",
          "enrollmentDate": "2024-10-30",
          "attributes": [
            {
              "attribute": "AtrDiseaCd1",
              "value": "B03"
            }
          ],
          "events": [
            {
              "event": "EVENT_456",
              "programStage": "PsInvestig1",
              "eventDate": "2024-10-30",
              "dataValues": [
                {
                  "dataElement": "DeCaseStat1",
                  "value": "NEW"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "trackedEntityInstance": "TEI123455",
      "attributes": [
        {
          "attribute": "AtrCaseNo01",
          "value": "CASE-20241029-0089"
        },
        {
          "attribute": "AtrFullNm01",
          "value": "王五"
        }
      ],
      "enrollments": [
        {
          "enrollment": "ENROLLMENT_788",
          "enrollmentDate": "2024-10-29",
          "attributes": [
            {
              "attribute": "AtrDiseaCd1",
              "value": "A02"
            }
          ],
          "events": [
            {
              "event": "EVENT_455",
              "programStage": "PsInvestig1",
              "eventDate": "2024-10-29",
              "dataValues": [
                {
                  "dataElement": "DeCaseStat1",
                  "value": "NEW"
                }
              ]
            }
          ]
        }
      ]
    }
    // ... 更多记录
  ]
}
```

**前端数据处理：**

```javascript
const pendingCases = data.trackedEntityInstances
  .filter(tei => {
    const event = tei.enrollments[0]?.events?.find(e => e.programStage === 'PsInvestig1');
    return event?.dataValues?.find(dv => dv.dataElement === 'DeCaseStat1')?.value === 'NEW';
  })
  .slice(0, 3)
  .map(tei => ({
    id: tei.trackedEntityInstance,
    caseNumber: tei.attributes.find(a => a.attribute === 'AtrCaseNo01')?.value,
    patientName: tei.attributes.find(a => a.attribute === 'AtrFullNm01')?.value,
    diseaseCode: tei.enrollments[0].attributes.find(a => a.attribute === 'AtrDiseaCd1')?.value,
    enrollmentDate: tei.enrollments[0].enrollmentDate
  }));

// 结果示例
// [
//   { id: 'TEI123456', caseNumber: 'CASE-20241030-0012', patientName: '李四', diseaseCode: 'B03', enrollmentDate: '2024-10-30' },
//   { id: 'TEI123455', caseNumber: 'CASE-20241029-0089', patientName: '王五', diseaseCode: 'A02', enrollmentDate: '2024-10-29' },
//   { id: 'TEI123454', caseNumber: 'CASE-20241029-0078', patientName: '赵六', diseaseCode: 'B03', enrollmentDate: '2024-10-29' }
// ]
```

------

### API-03: 获取处理中个案数

**请求地址**

```
GET http://[基地址]/api/trackedEntityInstances?ou=OuWuhou0001&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStatus=ACTIVE&paging=false&fields=enrollments[events[dataValues]]
```

**返回消息体**

```json
{
  "pager": {
    "total": 156
  },
  "trackedEntityInstances": [
    {
      "enrollments": [
        {
          "events": [
            {
              "dataValues": [
                {
                  "dataElement": "DeCaseStat1",
                  "value": "IN_PROGRESS"
                }
              ]
            }
          ]
        }
      ]
    }
    // ... 其他记录
  ]
}
```

**前端数据处理：**

```javascript
const inProgressCount = data.trackedEntityInstances.filter(tei => {
  const event = tei.enrollments[0]?.events?.find(e => e.programStage === 'PsInvestig1');
  return event?.dataValues?.find(dv => dv.dataElement === 'DeCaseStat1')?.value === 'IN_PROGRESS';
}).length; // 12
```

------

### API-05: 获取待确认检测记录（前5条）

**请求地址**

```
GET http://[基地址]/api/events?orgUnit=OuWuhou0001&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStage=PsTest00001&filter=DeTestStat1:EQ:PENDING_CONFIRMATION&pageSize=5&order=eventDate:desc&fields=event,eventDate,enrollment,orgUnitName,dataValues[dataElement,value]
```

**返回消息体**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 5,
    "total": 8
  },
  "events": [
    {
      "event": "EVENT_TEST_089",
      "eventDate": "2024-10-30",
      "enrollment": "ENROLLMENT_789",
      "orgUnitName": "武侯区",
      "dataValues": [
        {
          "dataElement": "DeTestNo001",
          "value": "TEST-20241030-0089"
        },
        {
          "dataElement": "DeTestType1",
          "value": "NAT"
        },
        {
          "dataElement": "DeTestStat1",
          "value": "PENDING_CONFIRMATION"
        }
      ]
    },
    {
      "event": "EVENT_TEST_088",
      "eventDate": "2024-10-29",
      "enrollment": "ENROLLMENT_788",
      "orgUnitName": "武侯区",
      "dataValues": [
        {
          "dataElement": "DeTestNo001",
          "value": "TEST-20241029-0088"
        },
        {
          "dataElement": "DeTestType1",
          "value": "ANTIBODY"
        },
        {
          "dataElement": "DeTestStat1",
          "value": "PENDING_CONFIRMATION"
        }
      ]
    }
    // ... 其他3条记录
  ]
}
```

**前端数据处理：**

```javascript
const pendingTests = data.events.map(event => ({
  eventId: event.event,
  testNumber: event.dataValues.find(dv => dv.dataElement === 'DeTestNo001')?.value,
  testType: event.dataValues.find(dv => dv.dataElement === 'DeTestType1')?.value,
  eventDate: event.eventDate,
  enrollmentId: event.enrollment
}));

// 结果示例
// [
//   { eventId: 'EVENT_TEST_089', testNumber: 'TEST-20241030-0089', testType: 'NAT', eventDate: '2024-10-30', enrollmentId: 'ENROLLMENT_789' },
//   { eventId: 'EVENT_TEST_088', testNumber: 'TEST-20241029-0088', testType: 'ANTIBODY', eventDate: '2024-10-29', enrollmentId: 'ENROLLMENT_788' },
//   ...
// ]
```

------

### API-06: 获取最近访问记录

**请求地址**

```
GET http://[基地址]/api/dataStore/userActivity/UserWuhou01
```

**返回消息体**

```json
{
  "recentVisits": [
    {
      "type": "case",
      "id": "TEI123456",
      "title": "CAS-2024-156",
      "url": "/case/TEI123456",
      "timestamp": "2024-10-30T14:20:00Z"
    },
    {
      "type": "case",
      "id": "TEI123450",
      "title": "CAS-2024-150",
      "url": "/case/TEI123450",
      "timestamp": "2024-10-30T10:15:00Z"
    },
    {
      "type": "alert",
      "id": "ALT-2024-012",
      "title": "病例聚集预警",
      "url": "/alert/ALT-2024-012",
      "timestamp": "2024-10-29T16:30:00Z"
    },
    {
      "type": "report",
      "id": "RPT-202410",
      "title": "疾病统计报表",
      "url": "/statistics/disease",
      "timestamp": "2024-10-28T11:00:00Z"
    }
  ]
}
```

**前端数据处理：**

```javascript
// 取最近4条
const recentVisits = data.recentVisits.slice(0, 4);
```

------

### API-07: 获取当前用户信息

**请求地址**

```
GET http://[基地址]/api/me?fields=id,username,firstName,surname,organisationUnits[id,name,level]
```

**返回消息体**

```json
{
  "id": "UserWuhou01",
  "username": "wuhou_cdc_001",
  "firstName": "王x",
  "surname": "强x",
  "organisationUnits": [
    {
      "id": "OuWuhou0001",
      "name": "武侯区",
      "level": 3
    }
  ]
}
```

------

### API-08: 记录用户访问行为

**请求地址**

```
PUT http://[基地址]/api/dataStore/userActivity/UserWuhou01
Content-Type: application/json
```

**请求消息体**

```json
{
  "recentVisits": [
    {
      "type": "case",
      "id": "TEI123460",
      "title": "CAS-2024-160",
      "url": "/case/TEI123460",
      "timestamp": "2024-10-30T15:30:00Z"
    },
    {
      "type": "case",
      "id": "TEI123456",
      "title": "CAS-2024-156",
      "url": "/case/TEI123456",
      "timestamp": "2024-10-30T14:20:00Z"
    }
    // ... 最多保留10条
  ]
}
```

**返回消息体**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "message": "Key 'UserWuhou01' updated in namespace 'userActivity'"
}
```

------

## 5. Error Handling

### 5.1 DataStore Key 不存在（首次访问）

**API-06 返回：**

```json
{
  "httpStatus": "Not Found",
  "httpStatusCode": 404,
  "status": "ERROR",
  "message": "Key 'UserWuhou01' not found in namespace 'userActivity'"
}
```

**前端处理：** 初始化空数组

```javascript
try {
  const response = await fetch(url);
  if (response.status === 404) {
    return { recentVisits: [] };
  }
  return await response.json();
} catch (error) {
  return { recentVisits: [] };
}
```

### 5.2 Analytics API 无数据

**API-01 返回：**

```json
{
  "headers": [...],
  "rows": [],
  "width": 3,
  "height": 0
}
```

**前端处理：** 显示"暂无数据"或默认值0

------

## 6. UI State Management

```javascript
const [dashboardData, setDashboardData] = useState({
  loading: true,
  indicators: {
    newCases: { count: 0, trend: 0, loading: true },
    pendingCases: { count: 0, loading: true },
    inProgressCases: { count: 0, loading: true },
    alerts: { count: 0, loading: true }
  },
  pendingItems: {
    cases: [],
    tests: [],
    alerts: [],
    loading: true
  },
  recentVisits: [],
  user: null
});
```

------

## 7. Performance Considerations

1. **首屏加载优化：**

   - 优先加载关键指标卡片（API-01 至 API-04）
   - 待办事项和最近访问记录延迟100ms加载

2. **数据缓存策略：**

   ```javascript
   const CACHE_CONFIG = {
     indicators: { ttl: 5 * 60 * 1000 },      // 5分钟
     pendingItems: { ttl: 30 * 1000 },        // 30秒
     recentVisits: { ttl: Infinity },         // 永久（会话内）
     user: { ttl: Infinity }                  // 永久
   };
   ```

3. **并发控制：**

   - 使用 `Promise.allSettled()` 确保单个API失败不阻塞其他请求

4. **错误降级：**

   - 单个指标加载失败7. Performance Considerations (continued)

     1. **错误降级：**

        - 单个指标加载失败时显示"--"，不影响其他区域
        - 使用 Skeleton Loading 提升感知性能

     2. **实时更新优化：**

        ```javascript
        // 使用 Server-Sent Events 替代轮询（可选）
        const eventSource = new EventSource('/api/dataStore/realtime/dashboard');
        eventSource.onmessage = (event) => {
          const updates = JSON.parse(event.data);
          setDashboardData(prev => ({ ...prev, ...updates }));
        };
        ```

     3. **移动端优化：**

        - 待办事项列表仅加载前3条（移动端）vs 前10条（桌面端）
        - 图表使用轻量级库（如 Chart.js 替代 ECharts）

     ------

     ## 8. Data Aggregation Logic

     ### 8.1 关键指标计算公式

     | 指标           | 计算方式                                                     | 数据源                            |
     | -------------- | ------------------------------------------------------------ | --------------------------------- |
     | 本月新增个案数 | COUNT(Enrollments) WHERE enrollmentDate BETWEEN thisMonthStart AND thisMonthEnd | Analytics API                     |
     | 趋势百分比     | ((本月 - 上月) / 上月) × 100%                                | Analytics API                     |
     | 待核实个案数   | COUNT(TEI) WHERE DeCaseStat1 = 'NEW'                         | TrackedEntityInstances + 前端过滤 |
     | 处理中个案数   | COUNT(TEI) WHERE DeCaseStat1 = 'IN_PROGRESS'                 | TrackedEntityInstances + 前端过滤 |
     | 本月预警事件数 | COUNT(Enrollments) WHERE program = PrgAlertMgt1 AND enrollmentDate IN THIS_MONTH | TrackedEntityInstances            |

     ### 8.2 待办事项排序规则

     ```javascript
     // 待核实个案：按报告日期降序
     pendingCases.sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
     
     // 待确认检测：按检测日期降序
     pendingTests.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
     
     // 待处理预警：按风险等级降序 > 创建时间降序
     pendingAlerts.sort((a, b) => {
       const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
       return (riskOrder[b.risk] - riskOrder[a.risk]) || 
              (new Date(b.created) - new Date(a.created));
     });
     ```

     ### 8.3 最近访问记录去重逻辑

     ```javascript
     // 合并新访问记录，去重并保留最新10条
     const mergeRecentVisits = (existing, newVisit) => {
       // 移除相同ID的旧记录
       const filtered = existing.filter(v => v.id !== newVisit.id);
       
       // 添加新记录到开头
       const merged = [newVisit, ...filtered];
       
       // 保留最新10条
       return merged.slice(0, 10);
     };
     
     // 使用示例
     const updatedVisits = mergeRecentVisits(existingVisits, {
       type: 'case',
       id: 'TEI123460',
       title: 'CAS-2024-160',
       url: '/case/TEI123460',
       timestamp: new Date().toISOString()
     });
     ```

     ------

     ## 9. Security Considerations

     ### 9.1 数据访问权限

     所有 API 请求自动继承 DHIS2 用户权限：

     ```javascript
     // API 自动应用的过滤条件
     ou = {用户可访问的机构}          // 基于用户 organisationUnits
     ouMode = DESCENDANTS              // 包含下级机构
     program = {用户有权限的Program}    // 基于用户角色
     ```

     ### 9.2 敏感数据脱敏

     待办事项列表中的患者信息需脱敏处理：

     ```javascript
     // 前端数据处理
     const maskPatientName = (name) => {
       if (name.length <= 1) return name;
       return name[0] + '*'.repeat(name.length - 1);
     };
     
     const maskNationalId = (id) => {
       if (id.length < 18) return id;
       return id.slice(0, 6) + '********' + id.slice(-4);
     };
     
     // 应用脱敏
     const displayData = {
       patientName: maskPatientName('李四'),    // → '李*'
       nationalId: maskNationalId('110101199001011234')  // → '110101********1234'
     };
     ```

     ### 9.3 DataStore 访问控制

     ```javascript
     // DataStore Key 命名规则
     // namespace: userActivity
     // key: {userId}  // 确保用户只能访问自己的数据
     
     // API 调用时验证
     const currentUserId = await getCurrentUser().id;
     const requestedUserId = extractUserIdFromUrl();
     
     if (currentUserId !== requestedUserId) {
       throw new Error('Unauthorized access to user activity data');
     }
     ```

     ------

     ## 10. Integration with External Systems

     ### 10.1 预警系统集成（假设外部API）

     如果预警数据来自外部系统：

     ```javascript
     // API-04 替代实现
     GET http://[外部系统地址]/api/alerts/summary?
       orgUnit=OuWuhou0001&
       startDate=2024-10-01&
       endDate=2024-10-31&
       status=PENDING
     
     // 响应示例
     {
       "total": 2,
       "alerts": [
         {
           "id": "ALT-2024-012",
           "type": "CLUSTER",
           "location": "北京市朝阳区",
           "level": "HIGH",
           "created": "2024-10-29T10:30:00Z"
         },
         {
           "id": "ALT-2024-011",
           "type": "ABNORMAL_SYMPTOM",
           "location": "上海市浦东区",
           "level": "MEDIUM",
           "created": "2024-10-28T15:20:00Z"
         }
       ]
     }
     ```

     ### 10.2 统计报表集成

     快捷入口"导出报告"可能调用外部报表系统：

     ```javascript
     // 点击"导出报告"
     POST http://[报表系统地址]/api/reports/generate
     Content-Type: application/json
     
     {
       "reportType": "MONTHLY_SUMMARY",
       "orgUnit": "OuWuhou0001",
       "period": "202410",
       "format": "PDF"
     }
     
     // 响应
     {
       "reportId": "RPT-202410-001",
       "downloadUrl": "https://reports.sccdc.cn/download/RPT-202410-001.pdf",
       "expiresAt": "2024-10-31T23:59:59Z"
     }
     ```

     ------

     ## 11. Fallback Strategies

     ### 11.1 Analytics API 不可用时的降级方案

     ```javascript
     // 主方案：使用 Analytics API
     const fetchNewCasesCount = async () => {
       try {
         const data = await fetchAnalytics();
         return calculateTrend(data);
       } catch (error) {
         console.warn('Analytics API failed, using fallback');
         return fetchNewCasesCountFallback();
       }
     };
     
     // 降级方案：直接统计 Enrollments
     const fetchNewCasesCountFallback = async () => {
       const thisMonthStart = '2024-10-01';
       const thisMonthEnd = '2024-10-31';
       const lastMonthStart = '2024-09-01';
       const lastMonthEnd = '2024-09-30';
       
       const [thisMonth, lastMonth] = await Promise.all([
         fetch(`/api/enrollments?program=PrgCaseMgt1&enrollmentEnrolledAfter=${thisMonthStart}&enrollmentEnrolledBefore=${thisMonthEnd}&paging=false&fields=none`),
         fetch(`/api/enrollments?program=PrgCaseMgt1&enrollmentEnrolledAfter=${lastMonthStart}&enrollmentEnrolledBefore=${lastMonthEnd}&paging=false&fields=none`)
       ]);
       
       return {
         count: thisMonth.pager.total,
         trend: calculateTrendPercent(thisMonth.pager.total, lastMonth.pager.total)
       };
     };
     ```

     ### 11.2 DataStore 不可用时的降级方案

     ```javascript
     // 最近访问记录使用 localStorage 作为备份
     const getRecentVisits = async (userId) => {
       try {
         const response = await fetch(`/api/dataStore/userActivity/${userId}`);
         if (response.ok) {
           const data = await response.json();
           // 同步到 localStorage
           localStorage.setItem('recentVisits', JSON.stringify(data.recentVisits));
           return data.recentVisits;
         }
       } catch (error) {
         console.warn('DataStore failed, using localStorage');
       }
       
       // 降级：从 localStorage 读取
       const cached = localStorage.getItem('recentVisits');
       return cached ? JSON.parse(cached) : [];
     };
     ```

     ------

     ## 12. Testing Scenarios

     ### 12.1 单元测试用例

     ```javascript
     describe('Dashboard Data Fetching', () => {
       test('should calculate trend correctly', () => {
         const thisMonth = 156;
         const lastMonth = 136;
         const trend = calculateTrend(thisMonth, lastMonth);
         expect(trend).toBe('+15%');
       });
       
       test('should filter pending cases correctly', () => {
         const mockData = [
           { status: 'NEW' },
           { status: 'IN_PROGRESS' },
           { status: 'NEW' },
           { status: 'CLOSED' }
         ];
         const pending = filterPendingCases(mockData);
         expect(pending).toHaveLength(2);
       });
       
       test('should handle empty analytics response', () => {
         const emptyResponse = { rows: [] };
         const result = parseAnalyticsData(emptyResponse);
         expect(result.count).toBe(0);
         expect(result.trend).toBe(0);
       });
     });
     ```

     ### 12.2 集成测试场景

     | 场景         | 测试步骤           | 预期结果                                |
     | ------------ | ------------------ | --------------------------------------- |
     | 首次登录用户 | 访问首页           | DataStore 返回404，显示空的最近访问列表 |
     | 数据权限限制 | 县级用户访问       | 仅显示本县及下级机构数据                |
     | 并发请求失败 | API-02超时         | 待核实卡片显示"加载失败"，其他卡片正常  |
     | 批量操作     | 点击待办项批量推送 | 逐个调用API，显示进度条                 |

     ------

     ## 13. Localization Support

     ### 13.1 多语言支持（可选）

     ```javascript
     // 疾病名称国际化
     const getDiseaseNameI18n = (diseaseCode, locale) => {
       const translations = {
         'B03': {
           'zh-CN': '新型冠状病毒肺炎(COVID-19)',
           'en-US': 'COVID-19'
         },
         'A02': {
           'zh-CN': '霍乱',
           'en-US': 'Cholera'
         }
       };
       return translations[diseaseCode]?.[locale] || diseaseCode;
     };
     
     // 状态名称国际化
     const getStatusNameI18n = (statusCode, locale) => {
       const translations = {
         'NEW': { 'zh-CN': '待核实', 'en-US': 'Pending' },
         'IN_PROGRESS': { 'zh-CN': '处理中', 'en-US': 'In Progress' },
         'CLOSED': { 'zh-CN': '已关闭', 'en-US': 'Closed' }
       };
       return translations[statusCode]?.[locale] || statusCode;
     };
     ```

     ------

     ## 14. Monitoring & Logging

     ### 14.1 性能监控

     ```javascript
     // 记录API响应时间
     const monitorApiPerformance = async (apiName, apiCall) => {
       const startTime = performance.now();
       try {
         const result = await apiCall();
         const duration = performance.now() - startTime;
         
         // 发送到监控系统
         sendMetric({
           metric: 'api_response_time',
           value: duration,
           tags: { api: apiName, status: 'success' }
         });
         
         return result;
       } catch (error) {
         const duration = performance.now() - startTime;
         sendMetric({
           metric: 'api_response_time',
           value: duration,
           tags: { api: apiName, status: 'error' }
         });
         throw error;
       }
     };
     
     // 使用示例
     const indicators = await monitorApiPerformance('dashboard-indicators', () => 
       fetchDashboardIndicators()
     );
     ```

     ### 14.2 错误日志

     ```javascript
     // 记录错误详情
     const logError = (context, error) => {
       const errorLog = {
         timestamp: new Date().toISOString(),
         context,
         message: error.message,
         stack: error.stack,
         userId: currentUser?.id,
         orgUnit: currentUser?.organisationUnits[0]?.id
       };
       
       // 发送到日志系统
       fetch('/api/logs/error', {
         method: 'POST',
         body: JSON.stringify(errorLog)
       });
       
       // 开发环境打印
       if (process.env.NODE_ENV === 'development') {
         console.error(errorLog);
       }
     };
     ```

     ------

     ## 15. Complete Data Flow Diagram

     ```
     ┌─────────────────────────────────────────────────────────────────────┐
     │                          Dashboard Page Load                         │
     └─────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │   API-07: Get Current User    │
                         │   (获取用户信息和权限)         │
                         └───────────────┬───────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │  Extract: userId, orgUnit     │
                         └───────────────┬───────────────┘
                                         │
             ┌───────────────────────────┼───────────────────────────┐
             │                           │                           │
             ▼                           ▼                           ▼
     ┌───────────────┐          ┌───────────────┐          ┌──────────────┐
     │   API-01      │          │   API-02      │          │   API-03     │
     │ (本月新增个案) │          │ (待核实个案)   │          │ (处理中个案)  │
     └───────┬───────┘          └───────┬───────┘          └──────┬───────┘
             │                           │                          │
             ▼                           ▼                          ▼
     ┌───────────────┐          ┌───────────────┐          ┌──────────────┐
     │ Calculate     │          │ Filter by     │          │ Count by     │
     │ Trend         │          │ Status=NEW    │          │ Status=IN... │
     └───────┬───────┘          └───────┬───────┘          └──────┬───────┘
             │                           │                          │
             └───────────────┬───────────┴──────────────────────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
     ┌───────────────┐  ┌──────────┐  ┌─────────────┐
     │   API-04      │  │ API-05   │  │  API-06     │
     │ (本月预警事件) │  │(待确认检测)│ │(最近访问)   │
     └───────┬───────┘  └────┬─────┘  └──────┬──────┘
             │               │                │
             └───────────────┼────────────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │  Aggregate & Render   │
                 │  (聚合数据并渲染UI)    │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │   Display Dashboard   │
                 │   - 关键指标卡片       │
                 │   - 待办事项列表       │
                 │   - 最近访问记录       │
                 │   - 快捷操作入口       │
                 └───────────────────────┘
     ```

     ------

     ## 16. Frontend Implementation Checklist

     ### 16.1 必须实现的功能

     - [ ] 关键指标卡片展示（4个）
     - [ ] 待办事项列表（3类）
     - [ ] 最近访问记录（前4条）
     - [ ] 快捷操作入口（4个）
     - [ ] 实时刷新机制（30秒轮询）
     - [ ] 错误处理和降级显示
     - [ ] 加载状态骨架屏
     - [ ] 数据缓存机制

     ### 16.2 推荐实现的功能

     - [ ] 趋势图表可视化（本月新增趋势）
     - [ ] 待办事项角标提醒
     - [ ] 下拉刷新（移动端）
     - [ ] 深色模式支持
     - [ ] 国际化支持（多语言）
     - [ ] 性能监控埋点
     - [ ] 用户行为分析

     ### 16.3 可选实现的功能

     - [ ] WebSocket 实时推送
     - [ ] 自定义卡片布局（拖拽排序）
     - [ ] 数据导出（PDF/Excel）
     - [ ] 语音播报待办提醒
     - [ ] 桌面通知（Browser Notification API）

     ------

     ## 17. API Response Time Benchmarks

     | API                 | 目标响应时间 | 最大可接受时间 | 降级策略              |
     | ------------------- | ------------ | -------------- | --------------------- |
     | API-01 (Analytics)  | < 500ms      | < 2000ms       | 使用 Enrollments 统计 |
     | API-02 (待核实个案) | < 800ms      | < 3000ms       | 仅显示数量，隐藏列表  |
     | API-03 (处理中个案) | < 800ms      | < 3000ms       | 显示缓存数据          |
     | API-04 (预警事件)   | < 500ms      | < 2000ms       | 隐藏预警卡片          |
     | API-05 (待确认检测) | < 600ms      | < 2500ms       | 仅显示数量            |
     | API-06 (最近访问)   | < 200ms      | < 1000ms       | 使用 localStorage     |
     | API-07 (用户信息)   | < 300ms      | < 1500ms       | 使用 sessionStorage   |

     ------

     ## 18. Code Example: Complete Data Fetching Logic

     ```javascript
     // dashboard.service.js
     
     import { dhis2Api } from './api';
     import { cacheManager } from './cache';
     
     export class DashboardService {
       async fetchDashboardData(userId, orgUnit) {
         // 并行请求所有数据
         const [
           indicators,
           pendingItems,
           recentVisits,
           user
         ] = await Promise.allSettled([
           this.fetchIndicators(orgUnit),
           this.fetchPendingItems(orgUnit),
           this.fetchRecentVisits(userId),
           this.fetchUserInfo()
         ]);
     
         return {
           indicators: this.handleResult(indicators, this.getDefaultIndicators()),
           pendingItems: this.handleResult(pendingItems, this.getDefaultPendingItems()),
           recentVisits: this.handleResult(recentVisits, []),
           user: this.handleResult(user, null)
         };
       }
     
       async fetchIndicators(orgUnit) {
         // 尝试从缓存读取
         const cached = cacheManager.get('dashboard:indicators');
         if (cached) return cached;
     
         try {
           // API-01: 新增个案数（含趋势）
           const newCases = await this.fetchNewCasesWithTrend(orgUnit);
           
           // API-02, API-03, API-04: 其他指标
           const [pending, inProgress, alerts] = await Promise.all([
             this.fetchPendingCasesCount(orgUnit),
             this.fetchInProgressCasesCount(orgUnit),
             this.fetchAlertsCount(orgUnit)
           ]);
     
           const result = { newCases, pending, inProgress, alerts };
           
           // 缓存5分钟
           cacheManager.set('dashboard:indicators', result, 5 * 60 * 1000);
           
           return result;
         } catch (error) {
           console.error('Failed to fetch indicators:', error);
           throw error;
         }
       }
     
       async fetchNewCasesWithTrend(orgUnit) {
         const url = `/api/analytics/enrollments/query/PrgCaseMgt1?dimension=ou:${orgUnit}&dimension=pe:THIS_MONTH;LAST_MONTH&outputType=ENROLLMENT`;
         
         const response = await dhis2Api.get(url);
         const rows = response.rows || [];
         
         const thisMonth = rows.find(r => r[1] === getCurrentMonth())?.[2] || 0;
         const lastMonth = rows.find(r => r[1] === getLastMonth())?.[2] || 0;
         
         return {
           count: parseInt(thisMonth),
           trend: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(0) : 0
         };
       }
     
       async fetchPendingCasesCount(orgUnit) {
         // API-02: 获取待核实个案
         const url = `/api/trackedEntityInstances?ou=${orgUnit}&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStatus=ACTIVE&pageSize=100&fields=enrollments[events[programStage,dataValues[dataElement,value]]]`;
         
         const response = await dhis2Api.get(url);
         
         // 前端过滤 status=NEW
         const pendingCount = response.trackedEntityInstances.filter(tei => {
           const event = tei.enrollments[0]?.events?.find(e => e.programStage === 'PsInvestig1');
           return event?.dataValues?.find(dv => dv.dataElement === 'DeCaseStat1')?.value === 'NEW';
         }).length;
         
         return pendingCount;
       }
     
       handleResult(settledResult, defaultValue) {
         if (settledResult.status === 'fulfilled') {
           return settledResult.value;
         }
         console.error('API failed:', settledResult.reason);
         return defaultValue;
       }
     
       getDefaultIndicators() {
         return {
           newCases: { count: '--', trend: 0 },
           pending: '--',
           inProgress: '--',
           alerts: '--'
         };
       }
     
       getDefaultPendingItems() {
         return {
           cases: [],
           tests: [],
           alerts: []
         };
       }
     }
     
     // 辅助函数
     function getCurrentMonth() {
       const date = new Date();
       return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
     }
     
     function getLastMonth() {
       const date = new Date();
       date.setMonth(date.getMonth() - 1);
       return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
     }
     ```

     ------

     **✅ 完成确认：** 本 API Contract 已覆盖"首页工作台"的所有后端交互需求，包括数据获取、性能优化、错误处理、降级策略和完整的实现示例。

     至此，三个核心页面的 API Contract 已全部完成：

     1. ✅ **WF-4.4: 新增个案表单页** - 数据输入
     2. ✅ **WF-4.2: 个案列表页** - 数据展示
     3. ✅ **WF-4.1: 首页工作台** - 数据聚合

     请确认是否需要继续其他页面（如 WF-4.3 个案详情页、WF-4.6 不明原因病例详情页等），或对已完成的文档进行任何调整。