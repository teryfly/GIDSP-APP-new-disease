import config from './config.json';

// Read DHIS2 config
const { baseUrl, username, password } = config.dhis2;
const auth = btoa(`${username}:${password}`);

// Type exports (type-only to avoid runtime ESM named export issues)
export type Dhis2Option = {
  id: string;
  code: string;
  name: string;
  sortOrder?: number;
};

export type Dhis2OptionSet = {
  id: string;
  name: string;
  options: Dhis2Option[];
};

export type Dhis2ProgramTrackedEntityAttribute = {
  id: string;
  mandatory: boolean;
  trackedEntityAttribute: {
    id: string;
    name: string;
    shortName: string;
    valueType: string;
    unique: boolean;
    optionSet?: { id: string; options: Dhis2Option[] };
  };
};

export type Dhis2ProgramStageDataElement = {
  id: string;
  dataElement: {
    id: string;
    name: string;
    valueType: string;
    optionSet?: { id: string; options: Dhis2Option[] };
  };
};

export type Dhis2ProgramStage = {
  id: string;
  name: string;
  sortOrder: number;
  programStageDataElements?: Dhis2ProgramStageDataElement[];
};

export type Dhis2ProgramMetadata = {
  id: string;
  name: string;
  programTrackedEntityAttributes: Dhis2ProgramTrackedEntityAttribute[];
  programStages: Dhis2ProgramStage[];
};

export type Dhis2OrganisationUnit = {
  id: string;
  name: string;
  path: string;
  level: number;
};

export type Dhis2User = {
  id: string;
  username: string;
  firstName: string;
  surname: string;
  organisationUnits: { id: string; name: string }[];
};

export type Dhis2TrackedEntityInstance = {
  trackedEntityInstance: string;
  attributes: { attribute: string; value: string }[];
};

export type Dhis2TEIResponse = {
  trackedEntityInstances: Dhis2TrackedEntityInstance[];
};

export type Dhis2ImportSummary = {
  reference: string;
  href: string;
  enrollments?: {
    importSummaries: { reference: string; href: string }[];
  };
};

export type Dhis2ApiResponse = {
  httpStatus: string;
  httpStatusCode: number;
  status: string;
  response: {
    responseType: string;
    status: string;
    imported?: number;
    updated?: number;
    deleted?: number;
    ignored?: number;
    importSummaries?: Dhis2ImportSummary[];
    conflicts?: { object: string; value: string }[];
    description?: string;
  };
};

// Generic fetch utility with authentication
async function dhis2Fetch(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    mode: 'cors',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(options && options.headers ? options.headers : {}),
    },
  });

  // Try parse JSON safely for both ok and error cases
  const tryParseJson = async () => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  };

  if (!response.ok) {
    const errorData = await tryParseJson();
    console.error('DHIS2 API Error:', errorData);
    const msg =
      (errorData && (errorData.message || errorData.description)) ||
      `DHIS2 API request failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  // Some DHIS2 endpoints may return empty bodies
  const data = await tryParseJson();
  return data;
}

/**
 * Fetches program metadata for "已知疾病个案管理".
 * @returns Program metadata including attributes and stages.
 */
export async function getProgramMetadata(): Promise<Dhis2ProgramMetadata> {
  const fields =
    'id,name,programTrackedEntityAttributes[id,mandatory,trackedEntityAttribute[id,name,shortName,valueType,unique,optionSet[id,options[id,code,name]]]],programStages[id,name,sortOrder,programStageDataElements[dataElement[id,name,valueType,optionSet[id,options[id,code,name]]]]]';
  return dhis2Fetch(`/api/programs/PrgCaseMgt1?fields=${fields}`);
}

/**
 * Fetches an option set by its ID.
 * @param optionSetId The ID of the option set.
 * @returns Option set details.
 */
export async function getOptionSet(optionSetId: string): Promise<Dhis2OptionSet> {
  const fields = 'id,name,options[id,code,name,sortOrder]';
  return dhis2Fetch(`/api/optionSets/${optionSetId}?fields=${fields}`);
}

/**
 * Fetches all organisation units accessible to the current user.
 * @returns List of organisation units.
 */
export async function getOrganisationUnits(): Promise<Dhis2OrganisationUnit[]> {
  const response = await dhis2Fetch(
    `/api/organisationUnits?userDataViewFallback=true&fields=id,name,path,level&paging=false`
  );
  return response.organisationUnits;
}

/**
 * Fetches current user information.
 * @returns User object.
 */
export async function getCurrentUser(): Promise<Dhis2User> {
  const fields = 'id,username,firstName,surname,organisationUnits[id,name]';
  return dhis2Fetch(`/api/me?fields=${fields}`);
}

/**
 * Checks for duplicate TEI based on national ID.
 * @param nationalId The ID card number to check.
 * @param orgUnitId The organisation unit ID to filter by.
 * @returns List of matching TEIs.
 */
export async function checkIdDuplicate(
  nationalId: string,
  orgUnitId: string
): Promise<Dhis2TEIResponse> {
  const teiNationalIdAttribute = 'AtrNatnlId1'; // Hardcoded as per contract
  return dhis2Fetch(
    `/api/trackedEntityInstances?ou=${orgUnitId}&ouMode=ACCESSIBLE&filter=${teiNationalIdAttribute}:EQ:${encodeURIComponent(
      nationalId
    )}&fields=trackedEntityInstance,attributes`
  );
}

/**
 * Creates a new TEI and Enrollment.
 * @param payload The TEI and Enrollment data.
 * @returns DHIS2 API response.
 */
export async function createTEIAndEnrollment(payload: any): Promise<Dhis2ApiResponse> {
  return dhis2Fetch('/api/trackedEntityInstances', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Creates a new Event.
 * @param payload The Event data.
 * @returns DHIS2 API response.
 */
export async function createEvent(payload: any): Promise<Dhis2ApiResponse> {
  return dhis2Fetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Helper to get option name from code
export const getOptionNameByCode = (
  optionSet: Dhis2OptionSet | undefined,
  code: string | undefined
): string => {
  if (!optionSet || !code) return '';
  const option = optionSet.options.find((opt) => opt.code === code);
  return option ? option.name : code;
};

// Helper to get option code from name
export const getOptionCodeByName = (
  optionSet: Dhis2OptionSet | undefined,
  name: string | undefined
): string => {
  if (!optionSet || !name) return '';
  const option = optionSet.options.find((opt) => opt.name === name);
  return option ? option.code : name;
};

// Helper to find a program attribute by its DHIS2 ID
export const findProgramAttribute = (
  programMetadata: Dhis2ProgramMetadata | undefined,
  attributeId: string
) => {
  return programMetadata?.programTrackedEntityAttributes.find(
    (ptea) => ptea.trackedEntityAttribute.id === attributeId
  )?.trackedEntityAttribute;
};

// Helper to find a data element by its DHIS2 ID within a program stage
export const findDataElement = (
  programMetadata: Dhis2ProgramMetadata | undefined,
  stageId: string,
  dataElementId: string
) => {
  const stage = programMetadata?.programStages.find((ps) => ps.id === stageId);
  return stage?.programStageDataElements?.find(
    (psde) => psde.dataElement.id === dataElementId
  )?.dataElement;
};