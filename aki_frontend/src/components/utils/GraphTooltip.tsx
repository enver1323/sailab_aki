import { DefaultTooltipContent, TooltipProps } from "recharts";


export const DateTooltip: React.FC<TooltipProps<any, any>> = (props) => {
    const { payload } = props

    const updatedPayload = (!!payload && payload.length > 0) ? [{
        name: "Date",
        value: new Date(payload[0].payload.date).toLocaleDateString('ko-Kr')
    }, ...payload] : payload

    const updatedProps = {
        ...props,
        payload:  updatedPayload
    }

    return <DefaultTooltipContent {...updatedProps} />
}