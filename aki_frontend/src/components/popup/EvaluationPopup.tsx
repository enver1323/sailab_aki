import { useEvaluation } from "@/hooks/useEvaluation"
import { EVALUATION_OPTION_TITLES, EvaluationPayload, GraphPayload } from "@/types/evaluation"
import { getEvaluationKey } from "@/utils/evaluation"
import { ChangeEvent, useEffect, useRef } from "react"
import _, { fromPairs } from 'lodash';
import styled from "styled-components"

const EvaluationCard = styled.div<{ x: number, y: number }>`
    position: absolute;
    top: ${(props) => props.y}px;
    left: ${(props) => props.x}px;
    transform: translate(-50%, -50%);
    background-color: white;
    border: 1px solid black;
    border-radius: 5px;
    padding: 0.1rem;
    z-index: 1;
    font-size: ${(props) => props.theme.font.size.sm};
`

const EvaluationItem = styled.label<{ color: string }>`
    display: block;
    color: ${(props) => props.color};
    margin: 0.5rem 0.5rem;
`

const EvaluationSelect = styled.select`
    display: block;
`

const formatPayload = (payload: EvaluationPayload) => {
    if (payload === null || payload.length === 0) return []

    const formattedPayload: Array<GraphPayload> = []
    const formattedData: { [key: string]: number | string | null } = {}

    const clone = (item: GraphPayload, cloneKey: string, cloneValue: number | string | null) => {
        formattedPayload.push({ color: item.color, dataKey: cloneKey, name: cloneKey, payload: formattedData })
        formattedData[cloneKey] = cloneValue
    }

    const cloneAndFormatAreaItem = (item: GraphPayload) => {
        const dataValues = (item.payload[item.dataKey] ?? [0, 0]) as Array<number>
        const dataKey = item.dataKey.slice(0, item.dataKey.length - 5)

        clone(item, `${dataKey}_min`, dataValues[0])
        clone(item, `${dataKey}_max`, dataValues[1])
    }

    payload.forEach((item: GraphPayload) => {
        switch (true) {
            case item.dataKey.endsWith('_lrp'):
                break
            case item.dataKey.endsWith('_area'):
                cloneAndFormatAreaItem(item)
                break
            default:
                const value = item.payload[item.dataKey]
                if (value === null) break
                
                clone(item, item.dataKey, item.payload[item.dataKey] as number)
        }
    })

    const dataValues = payload[0].payload
    formattedData['day'] = "day" in dataValues ? dataValues.day as number : null
    formattedData['slot'] = "slot" in dataValues ? dataValues.slot as number : null

    return formattedPayload
}

export const EvaluationPopup: React.FC = () => {
    const { payload, pos, setPayload, evaluation, updateEvaluation } = useEvaluation()
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside: EventListener = (event: Event) => {
            if (cardRef.current && !cardRef.current.contains(event.target as Node))
                setPayload(null)
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [cardRef]);

    const onSelectChange = (selected: GraphPayload, event: ChangeEvent<HTMLSelectElement>) => {
        const value = parseInt(event.target.value)
        updateEvaluation(getEvaluationKey(selected), value)
    }
    const getCurEval = (item: GraphPayload) => {
        const key = getEvaluationKey(item)
        return evaluation != null && key in evaluation ? evaluation[key] : ''
    }

    if (payload === null) return <></>

    const formattedPayload = formatPayload(payload)
    const dataValues = formattedPayload[0].payload

    const { x, y } = pos

    const getItemValue = (key: string) => {
        if (!(key in dataValues)) return ''
        const value = dataValues[key]
        if (Array.isArray(value)) return value.join('~')
        return value
    }

    return <EvaluationCard x={x} y={y} ref={cardRef}>
        {formattedPayload.map(item =>
            <EvaluationItem color={item.color} key={getEvaluationKey(item)}>
                {item.name}: {getItemValue(item.dataKey)}
                <EvaluationSelect
                    name={getEvaluationKey(item)}
                    onChange={(e) => onSelectChange(item, e)}
                    value={getCurEval(item)}
                    key={`${getEvaluationKey(item)}-select`}
                >
                    {Object.entries(EVALUATION_OPTION_TITLES).map(([name, value]) =>
                        <option value={name} key={`${item.dataKey}-option-${value}`}>{value}</option>
                    )}
                </EvaluationSelect>
            </EvaluationItem>
        )}
    </EvaluationCard>
}