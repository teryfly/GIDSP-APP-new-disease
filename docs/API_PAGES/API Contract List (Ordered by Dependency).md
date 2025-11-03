I'll analyze the uploaded files and list all API Contracts ordered by dependency (from basic/foundational to advanced). Let me examine the documents first.

<thinking> Let me analyze the documents to identify all pages and their dependencies:

From the Low-Fidelity Prototypes document, I can see these pages:

1. WF-4.1: 首页工作台 (Dashboard)
2. WF-4.2: 个案列表页 (Case List)
3. WF-4.3: 个案详情页 (Case Detail)
4. WF-4.4: 新增个案表单页 (New Case Form)
5. WF-4.5: 不明原因病例列表页 (Unknown Disease Case List)
6. WF-4.6: 不明原因病例详情页(推送流程) (Unknown Disease Case Detail with Push)
7. WF-4.7: 预警列表页 (Alert List)
8. WF-4.8: 统计分析页(疾病统计) (Statistical Analysis - Disease)
9. WF-4.9: 移动端适配示例(首页) (Mobile Dashboard)
10. WF-4.10: 页面流程图 (Page Flow)

From the supplement document: 11. WF-4.10: 疾病编码管理页 (Disease Code Management) - Note: duplicate number with flow diagram 12. WF-4.11: 病原微生物目录管理页 (Pathogen Management) 13. WF-4.12: 移动轨迹展示页 (Movement Trajectory) 14. WF-4.13: 病原微生物统计页 (Pathogen Statistics) 15. WF-4.14: 统计报表导出页 (Statistical Report Export) 16. WF-4.15: 系统配置管理页 (System Configuration) 17. WF-4.16: 接口监控页 (Interface Monitoring) 18. WF-4.17: 预警详情及处理页 (Alert Detail and Processing) 19. WF-4.18: 用户管理页 (User Management)

Now let me analyze dependencies from the perspective of data reliance:

**Level 1 (Most Basic - Metadata & Configuration):** These pages deal with foundational metadata that other modules depend on:

- WF-4.10(supplement): Disease Code Management - manages disease metadata
- WF-4.11: Pathogen Management - manages pathogen metadata
- WF-4.18: User Management - manages user access
- WF-4.15: System Configuration - system settings
- WF-4.16: Interface Monitoring - technical monitoring

**Level 2 (Core Data Entry):** These pages create and manage the primary tracker data:

- WF-4.4: New Case Form - creates tracked entities and enrollments
- WF-4.5: Unknown Disease Case List - lists unknown cases
- WF-4.6: Unknown Disease Case Detail - manages unknown cases and push to case management

**Level 3 (Core Data Management):** These pages manage existing tracker data:

- WF-4.2: Case List - displays tracked entities with enrollments
- WF-4.3: Case Detail - full tracked entity details with all stages
- WF-4.7: Alert List - displays alerts/events
- WF-4.17: Alert Detail and Processing - manages alerts

**Level 4 (Analysis & Reporting):** These pages aggregate and analyze the data:

- WF-4.12: Movement Trajectory - analyzes tracking records
- WF-4.8: Disease Statistics - aggregates case data
- WF-4.13: Pathogen Statistics - aggregates pathogen data
- WF-4.14: Statistical Report Export - exports aggregated data

**Level 5 (Dashboard & Overview):** These pages provide overview across all data:

- WF-4.1: Dashboard - overview of all modules
- WF-4.9: Mobile Dashboard - mobile version of overview

Let me organize this into a clear list with proper ordering. </thinking>

Based on my analysis of the uploaded files, here are all the API Contracts ordered by dependency level (from foundational to advanced):

------

## **API Contract List (Ordered by Dependency)**

### **Level 1: Foundation - Metadata & Configuration**

*These provide the foundational metadata that all other modules depend on*

| #    | Contract Name               | Corresponding WF     | Dependencies               | Description                                                  |
| ---- | --------------------------- | -------------------- | -------------------------- | ------------------------------------------------------------ |
| 1    | **Disease Code Management** | WF-4.10 (supplement) | None                       | Manages disease metadata (Option Sets) - UC01                |
| 2    | **Pathogen Management**     | WF-4.11              | Disease Code (for mapping) | Manages pathogen catalog and disease-pathogen mapping - UC02 |
| 3    | **User Management**         | WF-4.18              | Organisation Units         | Manages users, roles, and access control                     |
| 4    | **System Configuration**    | WF-4.15              | None                       | System settings and interface configurations - UC21          |
| 5    | **Interface Monitoring**    | WF-4.16              | System Configuration       | API monitoring and logging - UC22                            |

------

### **Level 2: Core Data Entry**

*These create the primary tracker data that other modules consume*

| #    | Contract Name                            | Corresponding WF | Dependencies                  | Description                                         |
| ---- | ---------------------------------------- | ---------------- | ----------------------------- | --------------------------------------------------- |
| 6    | **Unknown Disease Case Management**      | WF-4.5, WF-4.6   | Disease Code, Pathogen, Users | Lists and manages unknown cases - UC09, UC11        |
| 7    | **Unknown Case Push to Case Management** | WF-4.6           | Unknown Case, Disease Code    | Push workflow from unknown to case - UC10           |
| 8    | **New Case Form**                        | WF-4.4           | Disease Code, Users           | Creates new tracked entities and enrollments - UC04 |

------

### **Level 3: Core Data Management**

*These manage and display existing tracker data*

| #    | Contract Name                 | Corresponding WF | Dependencies               | Description                                           |
| ---- | ----------------------------- | ---------------- | -------------------------- | ----------------------------------------------------- |
| 9    | **Case List**                 | WF-4.2           | Disease Code, Users, Cases | Lists tracked entities with filtering - UC04          |
| 10   | **Case Detail & Management**  | WF-4.3           | Case List, All Stage Data  | Full case details with all program stages - UC04-UC08 |
| 11   | **Alert List**                | WF-4.7           | Cases, Events              | Lists alert events - UC03                             |
| 12   | **Alert Detail & Processing** | WF-4.17          | Alert List, Cases          | Manages alert processing - UC03                       |

------

### **Level 4: Analysis & Reporting**

*These aggregate and analyze the tracked data*

| #    | Contract Name                 | Corresponding WF | Dependencies                  | Description                           |
| ---- | ----------------------------- | ---------------- | ----------------------------- | ------------------------------------- |
| 13   | **Movement Trajectory**       | WF-4.12          | Cases, Tracking Records       | Visualizes movement paths - UC12      |
| 14   | **Disease Statistics**        | WF-4.8           | Cases, Disease Code           | Disease-based analytics - UC13, UC14  |
| 15   | **Pathogen Statistics**       | WF-4.13          | Cases, Pathogen, Test Records | Pathogen-based analytics - UC15, UC16 |
| 16   | **Statistical Report Export** | WF-4.14          | All Statistics                | Export aggregated reports - UC18      |

------

### **Level 5: Dashboard & Overview**

*These provide cross-module overviews*

| #    | Contract Name           | Corresponding WF | Dependencies | Description                             |
| ---- | ----------------------- | ---------------- | ------------ | --------------------------------------- |
| 17   | **Dashboard (Desktop)** | WF-4.1           | All modules  | Main dashboard with KPIs and todo lists |
| 18   | **Dashboard (Mobile)**  | WF-4.9           | All modules  | Mobile-optimized dashboard              |

------

## **Summary by Module Type**

### **Metadata Management (5 contracts)**

- Disease Code, Pathogen, User, System Config, Interface Monitoring

### **Case Management (6 contracts)**

- Unknown Case List/Detail/Push, New Case Form, Case List, Case Detail

### **Alert Management (2 contracts)**

- Alert List, Alert Detail & Processing

### **Analytics & Reporting (4 contracts)**

- Movement Trajectory, Disease Stats, Pathogen Stats, Report Export

### **Dashboard (2 contracts)**

- Desktop Dashboard, Mobile Dashboard

------

## **Recommended Implementation Order**

1. **Phase 1 (Foundation)**: Contracts #1-5 (Metadata & Config)
2. **Phase 2 (Data Entry)**: Contracts #6-8 (Unknown & Case Creation)
3. **Phase 3 (Management)**: Contracts #9-12 (Case & Alert Management)
4. **Phase 4 (Analytics)**: Contracts #13-16 (Statistics & Reports)
5. **Phase 5 (Integration)**: Contracts #17-18 (Dashboards)

------

**Total: 18 API Contracts** + 1 (editing)=19