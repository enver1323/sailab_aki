import React, { ChangeEvent } from "react";
import styled from "styled-components";
import LayoutPopup from "./LayoutPopup";
import { EVALUATION_OPTIONS, EvaluationType } from "@/types/evaluation";

interface IEvaluationPreviewModalProps {
    isOpen: boolean;
    evaluation: EvaluationType,
    onChange: (key: string, value: number) => void;
    onSave: () => void;
    onClose: VoidFunction;
}

const EvaluationRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid black;
`

const Wrapper = styled.div`
    font-size: ${(props) => props.theme.font.size.m};
    padding: 0 1rem;
`

const SaveBtn = styled.button`
    padding: 0.5rem 1rem;
`

const voidFn = () => {
    return;
};

const EvaluationPreviewModal: React.FC<IEvaluationPreviewModalProps> = ({ isOpen, onClose, evaluation, onChange, onSave }) => {
    const onSaveClick = () => {
        onSave()
        onClose()
    }
    const onEvaluate = (key: string, event: ChangeEvent<HTMLSelectElement>) => {
        onChange(key, parseInt(event.target.value))
    }
    return (
        <LayoutPopup
            isOpen={isOpen}
            onClose={onClose ?? voidFn}
            height={"500px"}
            header="Evaluation Preview Modal"
            footer={
                <SaveBtn onClick={onSaveClick}>Save</SaveBtn>
            }
        >
            <Wrapper>
                {evaluation !== null ? Object.entries(evaluation).map(([key, value]) =>
                    <EvaluationRow key={`${key}-evaluation`}>
                        <strong key={`${key}-eval-key`}>{key}</strong>
                        <select value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onEvaluate(key, event)} key={`${key}-eval-select`}>
                            {Object.entries(EVALUATION_OPTIONS).map(([evalKey, evalValue]) =>
                                <option value={evalKey} key={`${key}-eval-select-option-${evalKey}`}>{evalValue}</option>
                            )}
                        </select>
                    </EvaluationRow>
                ) : 'No evaluations were provided'}
            </Wrapper>
        </LayoutPopup>
    );
};

export default EvaluationPreviewModal;
