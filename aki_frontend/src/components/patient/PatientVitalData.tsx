import { SectionSubTitle } from "@/routes/predictions/atomic/Titles"
import { ITimeSeriesData } from "@/types/patientDetails"
import React from "react"
import styled from "styled-components"
import VitalGraph from "../graphs/VitalGraph"


const GridWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
`

const GridItemWrapper = styled.div`
    font-weight: ${(props) => props.theme.font.weight.normal};
    font-size: ${(props) => props.theme.font.size.sm};
`

const GridItem: React.FC<React.PropsWithChildren> = ({ children }) => <GridItemWrapper>{children}</GridItemWrapper>

export const PatientVitalData: React.FC<{ data: ITimeSeriesData['vital_data'] }> = ({ data }) => {
    return <GridWrapper>
        {Object.entries(data).map(([key, value]) =>
            <GridItem key={key}>
                <SectionSubTitle>{key}</SectionSubTitle>
                <VitalGraph data={value} />
            </GridItem>
        )}
    </GridWrapper>
}