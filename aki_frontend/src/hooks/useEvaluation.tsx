import { createContext, useState, useContext, useMemo, useRef, createRef } from "react";
import { EvaluationContextType, EvaluationType } from "@/types/evaluation";
import styled from "styled-components";

const EvaluationContext = createContext<EvaluationContextType>({
  evaluation: null,
  setEvaluation: () => { },
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

export const EvaluationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [evaluation, setEvaluation] = useState<EvaluationType>(null)
  const [payload, setPayload] = useState(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const updateEvaluation = (key: string, value: number) => {
    const updatedEvaluation = value !== 0
      ? { ...evaluation, [key]: value }
      : Object.fromEntries(Object.entries({ ...evaluation }).filter(([itemKey,]) => itemKey !== key))
    setEvaluation(updatedEvaluation)
  }

  const wrapperRef = useRef<HTMLDivElement>(null)

  const value: EvaluationContextType = useMemo(() => (
    { evaluation, setEvaluation, updateEvaluation, payload, setPayload, pos, setPos, wrapperRef }),
    [evaluation, payload, pos]
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