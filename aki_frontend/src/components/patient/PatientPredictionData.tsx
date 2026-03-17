import { ITimeSeriesData, TimeSeriesEntry } from "@/types/patientDetails"
import React, { useState } from "react"
import PredictionGraph from "@/components/graphs/PredictionGraph"
import Spacer from "@/components/utils/spacer"
import { PatientLevelData } from "@/components/patient/PatientLevelData"
import styled from "styled-components"

const GroundTruthTableWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
`;

const GroundTruthTable = styled.table`
    width: 100%;
    min-width: 960px;
    border-collapse: collapse;
    margin-top: 8px;

    th,
    td {
        border: 1px solid #dfdfdf;
        padding: 6px 8px;
        text-align: center;
        white-space: nowrap;
        font-size: 12px;
    }

    thead th {
        background: #f8f8f8;
        font-weight: 600;
        color: #333;
    }
`;

const getSlotLabel = (entry: TimeSeriesEntry) => `D${entry.day}-S${entry.slot}`;
const getGroundTruthSymbol = (value?: string) => (value === "+" ? "+" : "-");

export const PatientPredictionData: React.FC<{ data: ITimeSeriesData['prob_data'] }> = ({ data }) => {
    const targetThreshold = 0.5
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const reversedData = [...data].reverse()

    const selectedEntry = (selectedDay !== null)
        ? reversedData.find((entry: TimeSeriesEntry) => entry.day === selectedDay)
        : reversedData.find((entry: TimeSeriesEntry) => !!entry.probability && !!entry.threshold);

    const value = selectedEntry?.probability ?? 0;
    const threshold = selectedEntry?.threshold ?? 0;

    const normalizedValue = (value !== targetThreshold)
        ? (value < threshold
            ? value / threshold * targetThreshold
            : targetThreshold + (value - threshold) / (1 - threshold) * (1 - targetThreshold)
        ) : targetThreshold

    return <>
        {data && <PredictionGraph data={data} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />}
        {data && data.length > 0 ? (
            <>
                <Spacer height={16} />
                <GroundTruthTableWrapper>
                    <GroundTruthTable>
                        <thead>
                            <tr>
                                <th>Ground truth</th>
                                {data.map((entry, idx) => (
                                    <th key={`slot-${entry.day}-${entry.slot}-${idx}`}>{getSlotLabel(entry)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>AKI</td>
                                {data.map((entry, idx) => (
                                    <td key={`gt-${entry.day}-${entry.slot}-${idx}`}>
                                        {getGroundTruthSymbol(entry.ground_truth)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </GroundTruthTable>
                </GroundTruthTableWrapper>
            </>
        ) : null}
        {/* <Spacer height={20} /> */}
        {/* {data && <PatientLevelData value={normalizedValue} threshold={threshold} />} */}
    </>
}
