// 统一从合同映射透出，避免硬编码分散
import { PS, DE_INVEST } from './contractMapping';

export const PROGRAM_ID = 'PrgCaseMgt1';

export const PROGRAM_STAGE_INVESTIGATION_ID = PS.INVESTIGATION;
export const STAGE_FOLLOW_UP = PS.FOLLOW_UP;
export const STAGE_TREATMENT = PS.TREATMENT;
export const STAGE_TEST = PS.TEST;
export const STAGE_TRACKING = PS.TRACKING;

export const DE_CASE_STATUS = DE_INVEST.CASE_STATUS.id;
export const DE_EXPOSURE_HISTORY = DE_INVEST.EXPO_HIST.id;
export const DE_CONTACT_HISTORY = DE_INVEST.CONT_HIST.id;
export const DE_TRAVEL_HISTORY = DE_INVEST.TRAVEL_HIST.id;
export const DE_PUSH_EPI = DE_INVEST.PUSH_EPI.id;
export const DE_PUSH_EPI_DT = DE_INVEST.PUSH_EPI_DT.id;

export const ATR_CASE_NO = 'AtrCaseNo01';
export const ATR_FULL_NAME = 'AtrFullNm01';
export const ATR_DISEASE_CODE = 'AtrDiseaCd1';
export const ATR_RPT_DATE = 'AtrRptDt001';
export const ATR_RPT_ORG = 'AtrRptOrg01';
export const ATR_CASE_SRC = 'AtrCaseSrc1';