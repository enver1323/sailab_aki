export type Department = {
    id: number;
    name: string;
    external_id?: string | null;
    external_label_id?: number | null;
    threshold_freq: number;
    threshold_rare: number;
    threshold_recovery: number;
  };

export type DepartmentFormPayload = {
    name: string;
    external_id?: string | null;
    external_label_id?: number | null;
    threshold_freq: number;
    threshold_rare: number;
    threshold_recovery: number;
}

export type DepartmentErrorItem = {
  name?: Array<string>;
  external_id?: Array<string>;
  external_label_id?: Array<string>;
  threshold_freq?: Array<string>;
  threshold_rare?: Array<string>;
  threshold_recovery?: Array<string>;
};