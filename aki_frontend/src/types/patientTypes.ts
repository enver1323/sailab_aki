import { User } from "@/types/user";
import { Department } from "@/types/department";

export type AKIPredictionType = "severe" | "mild" | "safe" | "recovery";

export type Patient = {
  id: number;
  external_id: string;
  name: string | null;
};

export type PatientTreatment = "control" | "experimental" | "test";

export type Pagination = {
  next: number | null;
  page: number;
  per_page: number;
  prev: number | null;
  total: number;
};

export type PaginatedType<T> = {
  pagination: Pagination;
  items: Array<T>;
};

export type PatientInfoType = {
  id: number;
  medical_record_id: number;
  departments: Array<Department>;
  prediction_state: AKIPredictionType;
  treatment: PatientTreatment | null;
  updated_at: Date;
  source_data: Array<number> | null;
  prediction: Array<number> | null;
  prediction_weights: null;
  previous_actual_state: boolean;
  patient: Patient;
  reference_date: Date | null;
  alert_type: null;
  is_starred: boolean;
  is_viewed: boolean;
  is_deleted: boolean;
};

export type PatientUpdateDataType = {
  treatment?: PatientTreatment | null;
};

export type PredictionCollection = {
  general: Prediction;
};

export type Prediction = {
  total: number;
  accuracy: number;
  precision: number;
  recall: number;
};
