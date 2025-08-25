export enum AkiType {
  Severe = "중증",
  Mild = "경증",
  Recovery = "회복",
  Safety = "안전",
}

export type PatientInfo = {
  isFavorite: boolean;
  id: number;
  name: string;
  department: string;
  admission: Date;
  doesAkiOccured: boolean;
  akiType: AkiType;
};
