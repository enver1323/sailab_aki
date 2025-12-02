import { AuthErrorItem } from "@/types/auth";
import { UserErrorItem } from "@/types/user";
import { UserProps } from "@/types/user";
import { Patient, PatientInfoType } from "@/types/patientTypes";
import { Department, DepartmentErrorItem } from "@/types/department";
import { EvaluationRecord } from "@/types/evaluation";

export type Response<DataType = {}, ErrorType = {}> = {
  data: DataType | null;
  message: string;
  errors: ErrorType | null;
};

export type ErrorResponse = Response<null>;

export type UserResponse = Response<UserProps, AuthErrorItem>;
export type UserDetailsResponse = Response<UserProps, UserErrorItem>;
export type DepartmentDetailsResponse = Response<Department, DepartmentErrorItem>;
export type PatientResponse = Response<PatientInfoType>;
export type EvaluationResponse = Response<Array<EvaluationRecord>>;

export type PatientInterestResponse = Response<{
  status: boolean;
  patient: Patient;
}>;