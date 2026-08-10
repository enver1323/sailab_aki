import { ITimeSeriesData, ModelWindow, TimeSeriesEntry } from "@/types/patientDetails"
import React, { useState } from "react"
import PredictionGraph from "@/components/graphs/PredictionGraph"
import Spacer from "@/components/utils/spacer"
import { PatientLevelData } from "@/components/patient/PatientLevelData"
import { getSlotRegion, WINDOW_COLORS, WINDOW_LEGEND } from "@/components/utils/graphUtils"
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

const WindowLegend = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    font-size: 13px;
    color: #333;
    margin-bottom: 8px;
`;

const WindowLegendItem = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 8px;
`;

const WindowSwatch = styled.span<{ color: string }>`
    display: inline-block;
    width: 28px;
    height: 14px;
    background: ${(props) => props.color};
    border: 1px solid #c8c8c8;
`;

const NoFutureGroundTruthNote = styled.p`
    margin-top: 6px;
    font-size: 12px;
    color: ${WINDOW_COLORS.futureText};
`;

const REGION_BACKGROUNDS = {
    past: undefined,
    input: WINDOW_COLORS.input,
    output: WINDOW_COLORS.output,
    future: WINDOW_COLORS.future,
};

const getSlotLabel = (entry: TimeSeriesEntry) => `D${entry.day}-S${entry.slot}`;
const getGroundTruthSymbol = (value?: string | null) =>
    value === null || value === undefined ? "" : value === "+" ? "+" : "-";

type PatientPredictionDataProps = {
    data: ITimeSeriesData['prob_data'];
    modelWindow?: ModelWindow | null;
}

export const PatientPredictionData: React.FC<PatientPredictionDataProps> = ({ data, modelWindow }) => {
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

    const getRegionBackground = (entry: TimeSeriesEntry) =>
        REGION_BACKGROUNDS[getSlotRegion(entry.day, modelWindow)]

    const hasFutureGroundTruth = !!modelWindow
        && modelWindow.output_end_day !== null
        && modelWindow.output_end_day < modelWindow.n_days

    return <>
        {modelWindow ? (
            <WindowLegend>
                {WINDOW_LEGEND.map(({ key, label, color }) => (
                    <WindowLegendItem key={`window-legend-${key}`}>
                        <WindowSwatch color={color} />
                        {label}
                    </WindowLegendItem>
                ))}
            </WindowLegend>
        ) : null}
        {data && <PredictionGraph data={data} selectedDay={selectedDay} setSelectedDay={setSelectedDay} modelWindow={modelWindow} />}
        {data && data.length > 0 ? (
            <>
                <Spacer height={16} />
                <GroundTruthTableWrapper>
                    <GroundTruthTable>
                        <thead>
                            <tr>
                                <th>Ground truth</th>
                                {data.map((entry, idx) => (
                                    <th
                                        key={`slot-${entry.day}-${entry.slot}-${idx}`}
                                        style={{ background: getRegionBackground(entry) }}
                                    >
                                        {getSlotLabel(entry)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>AKI</td>
                                {data.map((entry, idx) => (
                                    <td
                                        key={`gt-${entry.day}-${entry.slot}-${idx}`}
                                        style={{ background: getRegionBackground(entry) }}
                                    >
                                        {getGroundTruthSymbol(entry.ground_truth)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </GroundTruthTable>
                </GroundTruthTableWrapper>
                {hasFutureGroundTruth ? (
                    <NoFutureGroundTruthNote>No future ground truth</NoFutureGroundTruthNote>
                ) : null}
            </>
        ) : null}
        {/* <Spacer height={20} /> */}
        {/* {data && <PatientLevelData value={normalizedValue} threshold={threshold} />} */}
    </>
}
