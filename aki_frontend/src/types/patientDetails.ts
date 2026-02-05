export interface IBasicPatientInfo {
  patientName: string;
  patientID: number;
  admissionDate: Date;
  dischargeDate?: Date;
  hospitalizationDuration: number;
  referenceDate: Date;
  hospitalWard: string;
  roomID: number;
  assignedDoctor: string;
  specialist: string;
  age: number;
  gender: "F" | "M";
  baselineCreatine: number;
}

export type LRPEntry = {
  field: string;
  value: number;
  lrp_value: number | string;
  comment?: string;
  category?: IRationaleType;
};

export type PatientBinaryDataEntry = {
  field: string;
  value: number | null;
  lrp_value: boolean;
};

export type TimeSeriesEntry = {
  day: number;
  date: number;
  creatine: number;
  baseline_creatine: number | null;
  probability: number;
  threshold: number;
  probability_daily?: number | null;
  slot: number;
};

export type PatientMetaData = {
  p_id: string;
  age: number;
  sex: number;
  bmi: number;
  b_egfr: number;
  icu: number;
  b_cr: number;
  department: string;
  stay_length: number;
  admin_room: string;
  date_discharge: Date | null;
};

export type RangeEntry = {
  day: number;
  slot: number;
} & { [key: string]: number | null };

export type VitalDataEntry = {
  day: number;
  slot: number;
} & { [key: string]: number | null };

export type PrescriptionDataEntry = {
  day: number;
  slot: number;
} & { [key: string]: string | null };

export type SurgicalDataEntry = {
  day: number;
  slot: number;
} & { [key: string]: string | null };

export interface ITimeSeriesData {
  prediction: {
    value: number;
    threshold: number;
  };
  general_data: PatientMetaData;
  binary_data: Array<PatientBinaryDataEntry>;
  test_data: Array<RangeEntry>;
  vital_data: { [key: string]: Array<VitalDataEntry> };
  prob_data: Array<TimeSeriesEntry>;
  prescription_data: Array<PrescriptionDataEntry>;
  surgical_data: Array<SurgicalDataEntry>;
}

export type IRationaleType =
  | "medicate"
  | "surgery"
  | "test"
  | "basic_info"
  | "disease"
  | "vital_signs";

export interface IPredictionRationale {
  id: number;
  rank: number;
  description: string;
  type: IRationaleType;
  testResult: boolean | number;
  contribution: number;
}