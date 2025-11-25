import { GraphClickSyntheticEvent } from "@/types/evaluation"
import { PatientBinaryDataEntry } from "@/types/patientDetails"
import { getGraphEvaluator } from "@/utils/evaluation"
import React, { BaseSyntheticEvent } from "react"
import { MdStarRate } from "react-icons/md"
import styled from "styled-components"


const GridWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
`

const GridItemBinaryValueSpan = styled.span`
    color: #ff9b00;
`

const GridItemWrapper = styled.p`
    font-weight: ${(props) => props.theme.font.weight.normal};
    font-size: ${(props) => props.theme.font.size.sm};
`

const GridItemBinaryValue: React.FC<React.PropsWithChildren> = ({ children }) => <GridItemBinaryValueSpan>{children ?? '(+)'}</GridItemBinaryValueSpan>

const GridItemStar = styled(MdStarRate)`
  cursor: pointer;

  &:hover {
    filter: brightness(0.2);
  }
`;

const GridItemTitle = styled.span`
  font-weight: ${(props) => props.theme.font.weight.bold};
  cursor: pointer;
`


const GridItem: React.FC<{ field: string, value: number | null, lrp_value: boolean, isBinary: boolean, onClick: (field: string, value: number | null, event: GraphClickSyntheticEvent) => void }> = ({ field, value, lrp_value, isBinary, onClick }) => {
    return <GridItemWrapper>
        <GridItemTitle onClick={(event: GraphClickSyntheticEvent) => onClick(field, value, event)}>{field}</GridItemTitle>
        {isBinary ? (value == 1 && <GridItemBinaryValue />) : `: ${value}`}
        {lrp_value && <GridItemStar color='ff9b00' />}
    </GridItemWrapper>
}

export const PatientBinaryInfo: React.FC<{ data: PatientBinaryDataEntry[] }> = ({ data }) => {
    const evaluationHandler = getGraphEvaluator()
    const handleClick = (field: string, value: number | null, event: GraphClickSyntheticEvent) => {
        const color = '#000'

        const payload = {
            activePayload: [{
                name: field,
                dataKey: field,
                color: color,
                fill: color,
                stroke: color,
                value: value,
                payload: { [field]: value }
            }]
        }

        evaluationHandler(payload, event)

    }
    return <GridWrapper>
        {data.map((item: PatientBinaryDataEntry) =>
            <GridItem {...item} isBinary={item.field != 'cci'} onClick={handleClick} key={item.field} />
        )}
    </GridWrapper>
}