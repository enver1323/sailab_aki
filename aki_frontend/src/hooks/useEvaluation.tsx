import { createContext, useState, useContext, useMemo, useRef, createRef, useEffect } from "react";
import { EvaluationContextType, EvaluationType } from "@/types/evaluation";
import styled from "styled-components";
import { useEvaluationShow } from "./queries/useEvaluationData";

const EvaluationContext = createContext<EvaluationContextType>({
  evaluation: null,
  setEvaluation: () => { },
  syncEvaluationWithServer: () => { },
  resetEvaluation: () => { },
  updateEvaluation: (key: string, value: number) => { },
  payload: null,
  setPayload: () => { },
  pos: { x: 0, y: 0 },
  setPos: () => { },
  wrapperRef: null
});

const EvaluationWrapper = styled.div`
  position: relative;
`;

export const EvaluationProvider: React.FC<React.PropsWithChildren & {patientMedicalRecordId: number}> = ({ patientMedicalRecordId, children }) => {
  const [evaluation, setEvaluation] = useState<EvaluationType>(null)
  const [savedEvaluation, setSavedEvaluation] = useState<EvaluationType>(null)
  const [payload, setPayload] = useState(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const cloneEvaluation = (data: EvaluationType): EvaluationType => {
    if (data === null) return null
    return { ...data }
  }

  const syncEvaluationWithServer = (data: EvaluationType) => {
    setSavedEvaluation(cloneEvaluation(data))
    setEvaluation(cloneEvaluation(data))
  }

  const resetEvaluation = () => {
    setEvaluation(cloneEvaluation(savedEvaluation))
  }

  const updateEvaluation = (key: string, value: number) => {
    const updatedEvaluation = value !== 0
      ? { ...evaluation, [key]: value }
      : Object.fromEntries(Object.entries({ ...evaluation }).filter(([itemKey,]) => itemKey !== key))
    setEvaluation(updatedEvaluation)
  }

  const { data: evaluations } = useEvaluationShow(patientMedicalRecordId)

  useEffect(() => {
    if (evaluations !== undefined) {
      syncEvaluationWithServer(evaluations)
    }
  }, [evaluations, setEvaluation])

  const wrapperRef = useRef<HTMLDivElement>(null)

  const value: EvaluationContextType = useMemo(() => (
    { evaluation, setEvaluation, syncEvaluationWithServer, resetEvaluation, updateEvaluation, payload, setPayload, pos, setPos, wrapperRef }),
    [evaluation, savedEvaluation, payload, pos]
  );

  return <EvaluationContext.Provider value={value}>
    <EvaluationWrapper ref={wrapperRef}>
      {children}
    </EvaluationWrapper>
  </EvaluationContext.Provider>;
};

export const useEvaluation = () => {
  return useContext(EvaluationContext);
};
