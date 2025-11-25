import { MutableRefObject, SyntheticEvent } from "react"

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
    payload: { [key: string]: number | null | Array<number> },
    color: string,
}

export type EvaluationPayload = Array<GraphPayload> | null;

export type EvaluationContextType = {
    evaluation: null,
    setEvaluation: (data: any) => void,
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