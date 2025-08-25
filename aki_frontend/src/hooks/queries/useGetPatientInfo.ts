import { useQuery } from "@tanstack/react-query";
import { useAPI } from "../useAPI";
import { PatientInfoType } from "@/types/patientTypes";
import { ITimeSeriesData } from "@/types/patientDetails";

export const useGetBasicPatientInfo = (patientMedicalRecordID: number) => {
  const api = useAPI();
  const fetchPatientInfo = () => {
    return api
      .get(`patients/records/${patientMedicalRecordID}`)
      .then((response) => response.data.data);
  };

  return useQuery<PatientInfoType, undefined>({
    queryKey: ["patientBasicInfo", { patientMedicalRecordID }],
    queryFn: fetchPatientInfo,
    keepPreviousData: false
  });
};
export const useGetPatientAKIPrediction = (patientMedicalRecordID: number) => {
  const api = useAPI();
  const queryPredictionData = () =>
    api
      .get(`patients/predictions/${patientMedicalRecordID}`)
      .then((response) => response.data.data);

  return useQuery<ITimeSeriesData, undefined>({
    queryKey: ["patientAKIPrediction", { patientMedicalRecordID }],
    queryFn: queryPredictionData,
    keepPreviousData: false
  });
};
