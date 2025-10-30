import { useState, useEffect } from 'react';
import {
  getProgramMetadata,
  getOptionSet,
  getOrganisationUnits,
  getCurrentUser,
} from '../dhis2';
import type {
  Dhis2ProgramMetadata,
  Dhis2OptionSet,
  Dhis2OrganisationUnit,
  Dhis2User,
} from '../dhis2';

interface Dhis2Data {
  programMetadata: Dhis2ProgramMetadata | null;
  diseaseCodesOptionSet: Dhis2OptionSet | null;
  genderOptionSet: Dhis2OptionSet | null;
  caseSourceOptionSet: Dhis2OptionSet | null;
  organisationUnits: Dhis2OrganisationUnit[];
  currentUser: Dhis2User | null;
}

interface UseDhis2DataResult {
  data: Dhis2Data;
  loading: boolean;
  error: string | null;
}

// DHIS2 IDs as per API Contract
const PROGRAM_ID = 'PrgCaseMgt1';
const DISEASE_CODES_OPTION_SET_ID = 'OsDiseasCd1';
const GENDER_OPTION_SET_ID = 'OsGender001';
const CASE_SOURCE_OPTION_SET_ID = 'OsCaseSrc01';

/**
 * Custom hook to fetch and manage DHIS2 metadata required for the New Case form.
 */
export const useDhis2Data = (): UseDhis2DataResult => {
  const [data, setData] = useState<Dhis2Data>({
    programMetadata: null,
    diseaseCodesOptionSet: null,
    genderOptionSet: null,
    caseSourceOptionSet: null,
    organisationUnits: [],
    currentUser: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all data concurrently
        const [
          programMetadata,
          diseaseCodesOptionSet,
          genderOptionSet,
          caseSourceOptionSet,
          organisationUnits,
          currentUser,
        ] = await Promise.all([
          getProgramMetadata(),
          getOptionSet(DISEASE_CODES_OPTION_SET_ID),
          getOptionSet(GENDER_OPTION_SET_ID),
          getOptionSet(CASE_SOURCE_OPTION_SET_ID),
          getOrganisationUnits(),
          getCurrentUser(),
        ]);

        setData({
          programMetadata,
          diseaseCodesOptionSet,
          genderOptionSet,
          caseSourceOptionSet,
          organisationUnits,
          currentUser,
        });
      } catch (err: any) {
        console.error('Failed to fetch DHIS2 data:', err);
        setError(err.message || 'An unknown error occurred while fetching DHIS2 data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};