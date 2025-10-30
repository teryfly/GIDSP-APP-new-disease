import { dhis2Client, buildFieldsParam } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID } from './constants';

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