import { MutableRefObject, SyntheticEvent } from "react"

export type EvaluationRecord = {
    column_name: string,
    value: number,
}

export type EvaluationType = {
    [key: string]: number
} | null

export type EvaluationPopupPos = {
    x: number,
    y: number
}

export type GraphPayload = {
    name: string,
    dataKey: string,
    payload: { [key: string]: number | null | Array<number> | string },
    activePayload: Array<{name: string}>,
    color: string,
}

export type EvaluationPayload = Array<GraphPayload> | null;

export type EvaluationContextType = {
    evaluation: EvaluationType,
    setEvaluation: (data: any) => void,
    updateEvaluation: (key: string, value: number) => void,
    payload: EvaluationPayload,
    setPayload: (data: any) => void,
    pos: EvaluationPopupPos,
    setPos: (pos: EvaluationPopupPos) => void,
    wrapperRef: MutableRefObject<HTMLDivElement | null> | null,
}

export interface GraphClickSyntheticEvent extends SyntheticEvent {
    nativeEvent: Event & {
        x: number, y: number
    },
    clientX: number,
    clientY: number,
    pageX: number,
    pageY: number,
}

export enum EvaluationOptions {
    NotImportant = 0,
    Important = 1,
    VeryImportant = 2,
}

export const EVALUATION_OPTION_TITLES = {
    [EvaluationOptions.NotImportant]: "Not Important",
    [EvaluationOptions.Important]: "Important",
    [EvaluationOptions.VeryImportant]: "Very Important",
}

export type EvaluationFormPayload = {
    [key: string]: number
} | null

export const CREATININE_OPITON_KEYS = {
    'creatinine_value': 'creatinine value',
    'creatinine_dynamics_up': 'creatinine dynamics up',
    'creatinine_dynamics_down': 'creatinine dynamics down',
    'creatinine_fluctuations': 'creatinine fluctuations'
}