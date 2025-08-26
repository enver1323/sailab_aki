import { ITimeSeriesData, TimeSeriesEntry } from "@/types/patientDetails"
import React, { useState } from "react"
import PredictionGraph from "@/components/graphs/PredictionGraph"
import Spacer from "@/components/utils/spacer"
import { PatientLevelData } from "@/components/patient/PatientLevelData"

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
        <Spacer height={20} />
        {data && <PatientLevelData value={normalizedValue} threshold={threshold} />}
    </>
}
