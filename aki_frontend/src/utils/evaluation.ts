import { GraphPayload, GraphClickSyntheticEvent } from "@/types/evaluation"
import { useEvaluation } from "../hooks/useEvaluation"

export const getGraphEvaluator = () => {
  const { setPayload, setPos, wrapperRef } = useEvaluation()

  const evaluator = (payload: any, event: GraphClickSyntheticEvent) => {
    console.log(payload);
    
    if (!payload.activePayload || payload.activePayload.length === 0) return

    const dataKeys = payload.activePayload.map((item: any) => item.name)
    const dataPayload = payload.activePayload[0].payload
    const entriesExist = dataKeys.some((key: string) => key
      && key in dataPayload
      && !!dataPayload[key]
      && (Array.isArray(dataPayload[key]) ? dataPayload[key].every((item: number | null) => !!item) : true)
    )

    if (!entriesExist) return

    const wrapperRect = wrapperRef?.current?.getBoundingClientRect()
    const xOffset = wrapperRect?.left ?? 0
    const yOffset = wrapperRect?.top ?? 0

    setPos({ x: event.clientX - xOffset, y: event.clientY - yOffset })
    setPayload(payload.activePayload)
  }

  return evaluator
}

export const getEvaluationKey = (item: GraphPayload) => {
  const { payload } = item
  let key = ""

  if ("day" in payload && payload.day !== null)
    key += `d${payload.day}_`

  if ("slot" in payload && payload.slot !== null)
    key += `${payload.slot}_`

  key += item.dataKey

  return key
}