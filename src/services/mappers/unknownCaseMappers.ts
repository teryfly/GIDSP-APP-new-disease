import { ATR_FULL_NAME, ATR_RPT_DATE, ATR_UNK_NO, DE_UNK_STATUS, type UnknownTrackedEntity } from '../unknownCaseService';

export interface UnknownCaseRow {
  key: string;
  trackedEntity: string;
  enrollment?: string;
  caseNo?: string;
  patientName?: string;
  reportDate?: string;
  statusCode?: string; // OsUnkStat01 code
  statusName?: string;
  urgency?: '高' | '中' | '低'; // derived or unknown
  orgUnit?: string;
}

export function mapTEIsToUnknownRows(tei: UnknownTrackedEntity, statusCodeMap?: Map<string, string>): UnknownCaseRow {
  const attrs = new Map(tei.attributes.map((a) => [a.attribute, a.value]));
  // Enrollment attributes: caseNo / reportDate
  const enr = tei.enrollments?.[0];
  const enrAttrs = new Map((enr?.attributes || []).map((a) => [a.attribute, a.value]));
  const caseNo = enrAttrs.get(ATR_UNK_NO) || attrs.get(ATR_UNK_NO);
  const reportDate = enrAttrs.get(ATR_RPT_DATE) || attrs.get(ATR_RPT_DATE);

  const row: UnknownCaseRow = {
    key: tei.trackedEntity,
    trackedEntity: tei.trackedEntity,
    enrollment: enr?.enrollment,
    caseNo,
    patientName: attrs.get(ATR_FULL_NAME),
    reportDate,
    statusCode: undefined,
    statusName: undefined,
    urgency: undefined,
    orgUnit: tei.orgUnit,
  };
  if (row.statusCode && statusCodeMap) {
    row.statusName = statusCodeMap.get(row.statusCode) || row.statusCode;
  }
  return row;
}

export function enrichWithLabEvent(row: UnknownCaseRow, latestEvent?: { dataValues: Array<{ dataElement: string; value: string }> }, statusCodeMap?: Map<string, string>) {
  if (!latestEvent) return row;
  const dv = new Map((latestEvent.dataValues || []).map((d) => [d.dataElement, String(d.value)]));
  const statusCode = dv.get(DE_UNK_STATUS);
  if (statusCode) {
    row.statusCode = statusCode;
    row.statusName = statusCodeMap?.get(statusCode) || statusCode;
  }
  const res = String(dv.get('DeUnkTstRst') || '').toUpperCase();
  if (res === 'POSITIVE') row.urgency = '高';
  else row.urgency = '中';
  return row;
}