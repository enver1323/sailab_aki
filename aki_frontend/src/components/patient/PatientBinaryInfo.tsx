import { PatientBinaryDataEntry } from "@/types/patientDetails"
import React from "react"
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


const GridItem: React.FC<{ field: string, value: number | null, lrp_value: boolean, isBinary: boolean }> = ({ field, value, lrp_value, isBinary }) => {
    return <GridItemWrapper>
        <strong>{field}</strong>
        {isBinary ? (value == 1 && <GridItemBinaryValue />) : `: ${value}`}
        {lrp_value && <GridItemStar color='ff9b00' />}
    </GridItemWrapper>
}

export const PatientBinaryInfo: React.FC<{ data: PatientBinaryDataEntry[] }> = ({ data }) => {
    return <GridWrapper>
        {data.map((item: PatientBinaryDataEntry) =>
            <GridItem {...item} isBinary={item.field != 'cci'} key={item.field} />
        )}
    </GridWrapper>
}