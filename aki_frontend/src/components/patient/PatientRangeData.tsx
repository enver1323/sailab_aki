import { SectionSubTitle } from "@/routes/predictions/atomic/Titles"
import { ITimeSeriesData } from "@/types/patientDetails"
import React from "react"
import styled from "styled-components"
import RangeGraph from "../graphs/RangeGraph"


const GridWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
`

const GridItemBinaryValueSpan = styled.span`
    color: #ff9b00;
`

const GridItemWrapper = styled.div`
    font-weight: ${(props) => props.theme.font.weight.normal};
    font-size: ${(props) => props.theme.font.size.sm};
`

const GridItem: React.FC<React.PropsWithChildren> = ({ children }) => <GridItemWrapper>{children}</GridItemWrapper>

export const PatientRangeData: React.FC<{ data: ITimeSeriesData['test_data'] }> = ({ data }) => {
    return <GridWrapper>
        <GridItem key="small">
            <SectionSubTitle>작은 범위</SectionSubTitle>
            <RangeGraph data={data.small} />
        </GridItem>
        <GridItem key="mid">
            <SectionSubTitle>중간 범위</SectionSubTitle>
            <RangeGraph data={data.mid} />
        </GridItem>
        <GridItem key="long">
            <SectionSubTitle>큰 범위</SectionSubTitle>
            <RangeGraph data={data.long} />
        </GridItem>
    </GridWrapper>
}