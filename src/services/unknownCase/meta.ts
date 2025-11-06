import { dhis2Client, buildFieldsParam } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, OS_GENDER_ID } from './constants';

export async function loadProgramMeta2() {
  const fields = buildFieldsParam([
    'id,name,programType,trackedEntityType[id]',
    'programTrackedEntityAttributes[mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,name,options[id,code,name]]]]',
    'programStages[id,name,repeatable,programStageDataElements[dataElement[id,name,valueType,optionSet[id,name,options[id,code,name]]]]]',
  ]);
  return dhis2Client.get<any>(`/api/programs/${PROGRAM_UNKNOWN_ID}`, { fields });
}

export interface Option { id: string; code: string; name: string }
export interface OptionSet { id: string; name: string; options: Option[] }

export async function getOptionSet(optionSetId: string): Promise<OptionSet> {
  const fields = buildFieldsParam(['id', 'name', 'options[id,code,name]']);
  return dhis2Client.get<OptionSet>(`/api/optionSets/${optionSetId}`, { fields });
}

export async function getGenderOptionSet(): Promise<OptionSet> {
  return getOptionSet(OS_GENDER_ID);
}

export interface OrgUnit {
  id: string;
  name: string;
  level: number;
}

export async function getOrgUnits(maxLevel: number = 3): Promise<OrgUnit[]> {
  const fields = buildFieldsParam(['id', 'name', 'level']);
  const res = await dhis2Client.get<{ organisationUnits: OrgUnit[] }>('/api/organisationUnits', {
    fields,
    paging: 'false',
    filter: `level:le:${maxLevel}`,
  });
  return res.organisationUnits || [];
}

export async function getOrgUnitById(id: string): Promise<OrgUnit | null> {
  const fields = buildFieldsParam(['id', 'name', 'level']);
  try {
    return await dhis2Client.get<OrgUnit>(`/api/organisationUnits/${id}`, { fields });
  } catch {
    return null;
  }
}