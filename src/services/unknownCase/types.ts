export interface Option { id: string; code: string; name: string }
export interface OptionSet { id: string; name: string; options: Option[] }

export interface MeResponse {
  id: string;
  username: string;
  organisationUnits: Array<{ id: string; name: string; path: string }>;
}

export interface UnknownTrackedEntity {
  trackedEntity: string;
  orgUnit: string;
  createdAt: string;
  updatedAt: string;
  attributes: Array<{ attribute: string; value: string; displayName?: string }>;
  enrollments: Array<{
    enrollment: string;
    enrolledAt: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    attributes?: Array<{ attribute: string; value: string }>;
  }>;
}

export interface TEIQueryResponse {
  pager: { page: number; pageSize: number; total: number; pageCount: number };
  trackedEntities: UnknownTrackedEntity[];
}

export interface TrackerEvent {
  event: string;
  program: string;
  programStage: string;
  enrollment: string;
  orgUnit: string;
  occurredAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULE';
  dataValues: Array<{ dataElement: string; value: string }>;
}