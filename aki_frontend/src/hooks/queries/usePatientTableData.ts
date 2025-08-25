import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaginatedType, PatientInfoType, PatientUpdateDataType, PredictionCollection } from "@/types/patientTypes";
import { PatientInterestResponse, Response, PatientResponse } from "@/types/responses";
import { useAPI } from "@/hooks/useAPI";
import { AxiosError } from "axios";

export const usePatientTableData = (
  view: "all" | "interests",
  page: number,
  search?: string,
  prediction: boolean = false,
  startDate?: string | null,
  endDate?: string | null
) => {
  const api = useAPI();
  const patientsQuery = async (
    page: number,
    search?: string,
    prediction: boolean = false,
    startDate?: string | null,
    endDate?: string | null
  ) => {
    const searchParams = new URLSearchParams();
    searchParams.append("view", view === "interests" ? "interest" : "all");
    searchParams.append("page", page.toString());
    searchParams.append("search", search ?? "");
    searchParams.append("prediction", prediction ? "1" : "0");
    if (!!startDate) searchParams.append("start_date", startDate);
    if (!!endDate) searchParams.append("end_date", endDate);

    return api.get(`patients?${searchParams.toString()}`).then((response) => response.data.data);
  };
  return useQuery<PaginatedType<PatientInfoType>, undefined>({
    queryKey: ["patientInfo", page, search, prediction, startDate, endDate],
    queryFn: () => patientsQuery(page, search, prediction, startDate, endDate),
    keepPreviousData: true,
  });
};

export const usePatientInterestMutation = () => {
  const queryClient = useQueryClient();
  const api = useAPI();

  const togglePatientInterest = async (patientID: number): Promise<PatientInterestResponse> =>
    api.post(`patients/interest`, { patient_id: patientID }).then((response) => response.data);

  return useMutation<PatientInterestResponse, unknown, { patientID: number }>({
    mutationFn: (payload) => togglePatientInterest(payload.patientID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientInfo"] });
    },
  });
};

export const usePatientRemoveMutation = () => {
  const queryClient = useQueryClient();
  const api = useAPI();

  const removePatient = async (patientMedicalRecordID: number): Promise<Response> =>
    api.delete(`patients/records/${patientMedicalRecordID}`).then((response) => response.data);

  return useMutation<Response, unknown, { patientMedicalRecordID: number }>({
    mutationFn: (payload) => removePatient(payload.patientMedicalRecordID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientInfo"] });
    },
  });
};

export const usePatientRecoverMutation = () => {
  const queryClient = useQueryClient();
  const api = useAPI();

  const recoverPatient = async (patientMedicalRecordID: number): Promise<Response> =>
    api.post(`patients/records/${patientMedicalRecordID}`).then((response) => response.data);

  return useMutation<Response, unknown, { patientMedicalRecordID: number }>({
    mutationFn: ({patientMedicalRecordID}) => recoverPatient(patientMedicalRecordID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientInfo"] });
    },
  });
};

export const usePatientUpdateMutation = () => {
  const queryClient = useQueryClient();
  const api = useAPI();

  const updatePatient = async (patientMedicalRecordID: number, data: PatientUpdateDataType): Promise<PatientResponse> =>
    api.put(`patients/records/${patientMedicalRecordID}`, data).then((response) => response.data);

  return useMutation<PatientResponse, unknown, { patientMedicalRecordID: number, data: PatientUpdateDataType }>({
    mutationFn: ({patientMedicalRecordID, data}) => updatePatient(patientMedicalRecordID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientInfo"] });
    },
  });
};


export const getUploadPatientFilesMutation =
  (url: string) =>
  (
    onSuccess: (response: Response) => void = () => {},
    onError: (err: AxiosError<Response>) => void = () => {}
  ) => {
    const api = useAPI();
    const queryClient = useQueryClient();

    const uploadPatientFilesQuery = async (formData: FormData): Promise<Response> => {
      return api.post(url, formData).then((response) => response.data);
    };

    return useMutation<Response, AxiosError<Response>, File[]>({
      mutationFn: (files) => {
        let data = new FormData();

        for (const file of files) data.append("items", file);

        return uploadPatientFilesQuery(data);
      },
      onSuccess: (response: Response) => {
        queryClient.invalidateQueries({ queryKey: ["patientInfo"] });
        queryClient.invalidateQueries({ queryKey: ["modelEvaluation"] });
        onSuccess(response)
      },
      onError,
    });
  };

export const usePredictionEvaluationData = (startDate?: string | null, endDate?: string | null) => {
  const api = useAPI();
  const evaluationQuery = async (startDate?: string | null, endDate?: string | null): Promise<PredictionCollection> => {
    const searchParams = new URLSearchParams();
    if (!!startDate) searchParams.append("start_date", startDate);
    if (!!endDate) searchParams.append("end_date", endDate);

    return api
      .get(`/patients/evaluate?${searchParams.toString()}`)
      .then((response) => response.data.data);
  };
  return useQuery<PredictionCollection, undefined>({
    queryKey: ["modelEvaluation", startDate, endDate],
    queryFn: () => evaluationQuery(startDate, endDate),
  });
};
