// Program and Stages (Unknown Case)
export const PROGRAM_UNKNOWN_ID = 'PrgUnknown1';
export const STAGE_REGISTER_ID = 'PsRegister1';
export const STAGE_LABTEST_ID = 'PsLabTest01';

// Attributes (Enrollment/TEI) for Unknown Case
export const ATR_UNK_NO = 'AtrUnkNo001';      // Unknown case number (Enrollment attribute by contract)
export const ATR_RPT_DATE = 'AtrRptDt001';    // Report date (Enrollment attribute)
export const ATR_FULL_NAME = 'AtrFullNm01';   // Name (TEI attribute)
export const ATR_NATIONAL_ID = 'AtrNatnlId1'; // National ID (TEI attribute)
export const ATR_RPT_ORG = 'AtrRptOrg01';     // Report org (Enrollment attribute)
export const ATR_UNK_SYMPT = 'AtrUnkSymp1';   // Clinical symptoms
export const ATR_UNK_PATHOGEN = 'AtrUnkPath1';// Suspected pathogen

// Data elements (events)
export const DE_UNK_STATUS = 'DeUnkStat01';   // Unknown case status (OsUnkStat01)
export const DE_UNK_TEST_RES = 'DeUnkTstRst'; // Test Result (OsTestRslt1)
export const DE_UNK_TEST_STAT = 'DeUnkTstSt1';// Test Status (OsTestStat1)

// OptionSets
export const OS_UNK_STATUS_ID = 'OsUnkStat01';

// Shared types
export interface Option { id: string; code: string; name: string }
export interface OptionSet { id: string; name: string; options: Option[] }

export interface MeResponse {
  id: string;
  username: string;
  organisationUnits: Array<{ id: string; name:Step [1/3] - Refactor Plan for unknownCaseService
Action: Create file
File Path: docs/refactor_plan_unknownCaseService_WF4.5.txt
