import type { Dhis2Option, Dhis2OptionAttributeValue } from '../types/dhis2';
import { ATTRIBUTE_IDS, OPTION_SET_IDS } from '../types/dhis2';
import { getOptionNameByCode } from '../api/optionSets';

function getAttrVal(attrs: Dhis2OptionAttributeValue[] | undefined, attrId: string): string | undefined {
  const found = attrs?.find(a => a.attribute.id === attrId);
  if (!found) return undefined;
  const v = found.value;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function setAttrVal(attributeValues: Dhis2OptionAttributeValue[], attrId: string, value: any, name?: string) {
  const idx = attributeValues.findIndex(a => a.attribute.id === attrId);
  const entry: Dhis2OptionAttributeValue = {
    value,
    attribute: { id: attrId, name },
  };
  if (idx >= 0) attributeValues[idx] = entry;
  else attributeValues.push(entry);
}

export type DiseaseCodeView = {
  id: string;
  name: string;
  code: string;
  icdCode?: string;
  categoryCode?: string;
  categoryName?: string;
  riskLevelCode?: string;
  riskLevelName?: string;
  isActive?: boolean;
  isQuarantine?: boolean;
  relatedPathogenCode?: string;
};

export function toDiseaseCodeView(opt: Dhis2Option): DiseaseCodeView {
  const icd = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.ICD_CODE);
  const cat = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.DISEASE_CATEGORY);
  const risk = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.RISK_LEVEL);
  const enabled = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.ENABLED);
  const quarantine = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.QUARANTINE);
  const relPath = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.RELATED_PATHOGEN);

  return {
    id: opt.id,
    name: opt.name,
    code: opt.code,
    icdCode: icd,
    categoryCode: cat,
    categoryName: getOptionNameByCode(OPTION_SET_IDS.DiseaseCategory, cat),
    riskLevelCode: risk,
    riskLevelName: getOptionNameByCode(OPTION_SET_IDS.RiskLevel, risk),
    isActive: enabled === 'true',
    isQuarantine: quarantine === 'true',
    relatedPathogenCode: relPath,
  };
}

export type PathogenView = {
  id: string;
  name: string;
  code: string;
  scientificName?: string;
  pathogenTypeCode?: string;
  pathogenTypeName?: string;
  biosafetyLevelCode?: string;
  biosafetyLevelName?: string;
  description?: string;
  associatedDiseases?: string;
  isActive?: boolean;
};

export function toPathogenView(opt: Dhis2Option): PathogenView {
  const sn = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.SCIENTIFIC_NAME);
  const ptype = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.PATHOGEN_TYPE);
  const bsl = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.BSL);
  const desc = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.PATHOGEN_DESC);
  const assoc = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.ASSOCIATED_DISEASES);
  const enabled = getAttrVal(opt.attributeValues, ATTRIBUTE_IDS.ENABLED);

  return {
    id: opt.id,
    name: opt.name,
    code: opt.code,
    scientificName: sn,
    pathogenTypeCode: ptype,
    pathogenTypeName: getOptionNameByCode(OPTION_SET_IDS.PathogenType, ptype),
    biosafetyLevelCode: bsl,
    biosafetyLevelName: getOptionNameByCode(OPTION_SET_IDS.BioSafetyLevel, bsl),
    description: desc,
    associatedDiseases: assoc,
    isActive: enabled === 'true',
  };
}

export type DiseaseCodeFormPayload = {
  code: string;
  name: string;
  sortOrder: number;
  optionSet: { id: string };
  attributeValues: Dhis2OptionAttributeValue[];
};

export function fromDiseaseFormToPayload(
  form: {
    diseaseCode: string;
    diseaseName: string;
    diseaseCategory?: string;
    icdCode?: string;
    description?: string;
    riskLevel?: string;
    isQuarantine?: boolean;
    isActive?: boolean;
    relatedPathogens?: string[];
  },
  sortOrder: number
): DiseaseCodeFormPayload {
  const attributeValues: Dhis2OptionAttributeValue[] = [];
  if (form.icdCode) setAttrVal(attributeValues, ATTRIBUTE_IDS.ICD_CODE, form.icdCode, 'ICD编码');
  if (form.description) setAttrVal(attributeValues, ATTRIBUTE_IDS.DISEASE_DESC, form.description, '疾病描述');
  if (form.diseaseCategory) setAttrVal(attributeValues, ATTRIBUTE_IDS.DISEASE_CATEGORY, form.diseaseCategory, '疾病类别');
  if (form.riskLevel) setAttrVal(attributeValues, ATTRIBUTE_IDS.RISK_LEVEL, form.riskLevel, '风险等级');
  if (typeof form.isActive === 'boolean') setAttrVal(attributeValues, ATTRIBUTE_IDS.ENABLED, form.isActive, '是否启用');
  if (typeof form.isQuarantine === 'boolean') setAttrVal(attributeValues, ATTRIBUTE_IDS.QUARANTINE, form.isQuarantine, '是否是检疫传染病');
  if (form.relatedPathogens && form.relatedPathogens.length > 0) {
    setAttrVal(attributeValues, ATTRIBUTE_IDS.RELATED_PATHOGEN, form.relatedPathogens[0], '关联病原体');
  }

  return {
    code: form.diseaseCode,
    name: form.diseaseName,
    sortOrder,
    optionSet: { id: OPTION_SET_IDS.DiseaseCodes },
    attributeValues,
  };
}

export type PathogenFormPayload = {
  code: string;
  name: string;
  sortOrder: number;
  optionSet: { id: string };
  attributeValues: Dhis2OptionAttributeValue[];
};

export function fromPathogenFormToPayload(
  form: {
    pathogenCode: string;
    pathogenName: string;
    pathogenType?: string;
    scientificName?: string;
    associatedDiseases?: string;
    description?: string;
    biosafettyLevel?: string;
    isActive?: boolean;
  },
  sortOrder: number
): PathogenFormPayload {
  const attributeValues: Dhis2OptionAttributeValue[] = [];
  if (form.scientificName) setAttrVal(attributeValues, ATTRIBUTE_IDS.SCIENTIFIC_NAME, form.scientificName, '学名');
  if (typeof form.isActive === 'boolean') setAttrVal(attributeValues, ATTRIBUTE_IDS.ENABLED, form.isActive, '是否启用');
  if (form.biosafettyLevel) setAttrVal(attributeValues, ATTRIBUTE_IDS.BSL, form.biosafettyLevel, '生物安全等级');
  if (form.description) setAttrVal(attributeValues, ATTRIBUTE_IDS.PATHOGEN_DESC, form.description, '病原体描述');
  if (form.pathogenType) setAttrVal(attributeValues, ATTRIBUTE_IDS.PATHOGEN_TYPE, form.pathogenType, '病原体类型');
  if (form.associatedDiseases) setAttrVal(attributeValues, ATTRIBUTE_IDS.ASSOCIATED_DISEASES, form.associatedDiseases, '相关疾病');

  return {
    code: form.pathogenCode,
    name: form.pathogenName,
    sortOrder,
    optionSet: { id: OPTION_SET_IDS.Pathogens },
    attributeValues,
  };
}