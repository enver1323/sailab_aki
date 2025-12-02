import { useMutation, useQuery } from "@tanstack/react-query";
import { useAPI } from "@/hooks/useAPI";
import { AxiosError } from "axios";
import { EvaluationFormPayload, EvaluationType, EvaluationRecord } from "@/types/evaluation";
import { EvaluationResponse } from "@/types/responses";


const formatResponse = (records: Array<EvaluationRecord>) => Object.fromEntries(records.map(record => [record.column_name, record.value]))

export const useEvaluationShow = (id: number) => {
  const api = useAPI();
  const evaluationQuery = async (id: number) =>
    api.get(`patients/evaluations/${id}`).then(({ data: payload }) => payload.data ?? []).then(formatResponse);

  return useQuery<EvaluationType, undefined>({
    queryKey: ["evaluationShow", id],
    queryFn: () => evaluationQuery(id),
    keepPreviousData: false,
  });
};

export const useEvaluationEdit = (
  onSuccess: (data: EvaluationType) => void = () => { },
  onError: (err: AxiosError<EvaluationResponse>) => void = () => { }
) => {
  const api = useAPI();

  const editQuery = async (patientMedicalRecordId: number, data: EvaluationFormPayload): Promise<EvaluationResponse> =>
    api.put(`patients/evaluations/${patientMedicalRecordId}`, data).then((response) => response.data);

  return useMutation<
    EvaluationResponse,
    AxiosError<EvaluationResponse>,
    { patientMedicalRecordId: number; data: EvaluationFormPayload }
  >({
    mutationFn: ({ patientMedicalRecordId, data }) => editQuery(patientMedicalRecordId, data),
    onSuccess: ({ data }: EvaluationResponse) => {
      if (!data) return onSuccess({});

      return onSuccess(formatResponse(data));
    },
    onError,
  });
};