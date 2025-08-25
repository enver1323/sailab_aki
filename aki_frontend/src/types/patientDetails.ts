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
  icu: number;
  b_cr: number;
  department: string;
  stay_length: number;
  admin_room: string;
  date_discharge: Date | null;
};

export type SmallRangeEntry = {
  day: number;
  slot: number;
  albumin_avg: number | null;
  albumin_avg_lrp: number | null;
  bilirubin_avg: number | null;
  bilirubin_avg_lrp: number | null;
  creatinine_avg: number | null;
  creatinine_avg_lrp: number | null;
  potassium_avg: number | null;
  potassium_avg_lrp: number | null;
};
export type MidRangeEntry = {
  day: number;
  slot: number;
  alt_avg: number | null;
  alt_avg_lrp: number | null;
  ast_avg: number | null;
  ast_avg_lrp: number | null;
  bun_avg: number | null;
  bun_avg_lrp: number | null;
  calcium_avg: number | null;
  calcium_avg_lrp: number | null;
  co2_avg: number | null;
  co2_avg_lrp: number | null;
  hb_avg: number | null;
  hb_avg_lrp: number | null;
  wbc_avg: number | null;
  wbc_avg_lrp: number | null;
};
export type LongRangeEntry = {
  day: number;
  slot: number;
  chloride_avg: number | null;
  chloride_avg_lrp: number | null;
  glucose_avg: number | null;
  glucose_avg_lrp: number | null;
  plt_avg: number | null;
  plt_avg_lrp: number | null;
  sodium_avg: number | null;
  sodium_avg_lrp: number | null;
};

export type VitalDataEntry = {
  day: number;
  slot: number;
  chloride_avg: number | null;
  chloride_avg_lrp: number | null;
  glucose_avg: number | null;
  glucose_avg_lrp: number | null;
  plt_avg: number | null;
  plt_avg_lrp: number | null;
  sodium_avg: number | null;
  sodium_avg_lrp: number | null;
};

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
  test_data: {
    small: Array<SmallRangeEntry>;
    mid: Array<MidRangeEntry>;
    long: Array<LongRangeEntry>;
  };
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
