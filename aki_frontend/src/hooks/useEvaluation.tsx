import { createContext, useState, useContext, useMemo, useRef, createRef } from "react";
import { EvaluationContextType } from "@/types/evaluation";
import styled from "styled-components";

const EvaluationContext = createContext<EvaluationContextType>({
  evaluation: null,
  setEvaluation: () => { },
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
  const [evaluation, setEvaluation] = useState(null)
  const [payload, setPayload] = useState(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const wrapperRef = useRef<HTMLDivElement>(null)

  const value: EvaluationContextType = useMemo(() => (
    { evaluation, setEvaluation, payload, setPayload, pos, setPos, wrapperRef }),
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