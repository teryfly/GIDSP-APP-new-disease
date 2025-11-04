import type { OptionSet, TrackedEntity } from '../caseService2';
import { ATR_CASE_NO, ATR_DISEASE_CODE, ATR_FULL_NAME, ATR_RPT_DATE } from '../caseService2';

export interface CaseRow {
  key: string;
  trackedEntity: string;
  enrollment?: string;
  caseNo?: string;
  patientName?: string;
  diseaseCode?: string;
  diseaseName?: string;
  reportDate?: string;
  statusTag?: '待核实' | '处理中' | '已关闭';
  orgUnit?: string;
}

export function mapTEIsToRows(teis: TrackedEntity[], diseaseOs: OptionSet): CaseRow[] {
  const codeToName = new Map<string, string>();
  for (const opt of diseaseOs.options) codeToName.set(opt.code, opt.name);

  return teis.map((tei) => {
    const attrs = new Map(tei.attributes.map(a => [a.attribute, a.value]));
    const caseNo = attrs.get(ATR_CASE_NO);
    const patientName = attrs.get(ATR_FULL_NAME);
    const diseaseCode = attrs.get(ATR_DISEASE_CODE);
    const reportDate = attrs.get(ATR_RPT_DATE);

    const enrollment = tei.enrollments?.[0]?.enrollment;

    // Status is a data element in stage; not available here by contract; we default by enrollment status
    let statusTag: CaseRow['statusTag'] = '处理中';
    const enrStatus = tei.enrollments?.[0]?.status;
    if (enrStatus === 'ACTIVE') statusTag = '处理中';
    if (enrStatus === 'COMPLETED') statusTag = '已关闭';
    if (enrStatus === 'CANCELLED') statusTag = '待核实';

    return {
      key: tei.trackedEntity,
      trackedEntity: tei.trackedEntity,
      enrollment,
      caseNo,
      patientName,
      diseaseCode,
      diseaseName: diseaseCode ? codeToName.get(diseaseCode) : undefined,
      reportDate,
      statusTag,
      orgUnit: tei.orgUnit,
    };
  });
}