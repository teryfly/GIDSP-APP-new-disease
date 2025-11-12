export interface Dhis2OptionAttributeValue {
  value: string | boolean | number;
  attribute: {
    id: string;
    name?: string;
    displayName?: string;
  };
}

export interface Dhis2Option {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  sortOrder?: number;
  optionSet?: { id: string };
  attributeValues?: Dhis2OptionAttributeValue[];
  created?: string;
  lastUpdated?: string;
}

export interface Dhis2OptionsResponse {
  pager: {
    page: number;
    total: number;
    pageSize: number;
    pageCount: number;
  };
  options: Dhis2Option[];
}

export interface Dhis2OptionSet {
  id: string;
  name?: string;
  displayName?: string;
  options?: Array<{
    id: string;
    code?: string;
    name: string;
    displayName?: string;
  }>;
}

export interface Dhis2OptionSetsResponse {
  pager: {
    page: number;
    total: number;
    pageSize: number;
    pageCount: number;
  };
  optionSets: Dhis2OptionSet[];
}

export const OPTION_SET_IDS = {
  DiseaseCodes: 'OsDiseasCd1',
  Pathogens: 'OsPathogen1',
  DiseaseCategory: 'GirI3iJIl8I',
  PathogenType: 'fOltKFcJt5a',
  BioSafetyLevel: 'krlgQmMI9IK',
  RiskLevel: 'RMpSUMUiWOg',
} as const;

export const ATTRIBUTE_IDS = {
  ICD_CODE: 'nwELUNQYqSJ',
  DISEASE_DESC: 'mB6uOMiz3Ug',
  DISEASE_CATEGORY: 'OoP7T3QaCUU',
  RISK_LEVEL: 'WndpEL0OBpm',
  ENABLED: 'qG2jY5sPRZO',
  QUARANTINE: 'qvHRnLPOctz',
  RELATED_PATHOGEN: 'kbtlecOhgTq',
  SCIENTIFIC_NAME: 'XAeUIZQuPqs',
  BSL: 'isfD2HcM6dC',
  PATHOGEN_DESC: 'vHy3yX7wLEH',
  PATHOGEN_TYPE: 'cKJppIbhmDU',
  ASSOCIATED_DISEASES: 'CoGSiu3eIBN',
} as const;

export type PageParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  order?: string;
};