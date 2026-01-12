import React, { ChangeEvent, MouseEventHandler } from "react";
import styled from "styled-components";
import LayoutPopup from "./LayoutPopup";
import { EVALUATION_OPTION_TITLES, EvaluationOptions, EvaluationType } from "@/types/evaluation";
import { FaTimes } from "react-icons/fa";

interface IEvaluationPreviewModalProps {
    isOpen: boolean;
    evaluation: EvaluationType,
    onChange: (key: string, value: number) => void;
    onSave: () => void;
    onClose: VoidFunction;
}

const FooterRow = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    font-size: ${(props) => props.theme.font.size.sm}
`

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

    const evaluationValues: number[] = Object.entries(evaluation ?? {}).map(([_, v]) => v)
    const evaluationStatOptions: EvaluationOptions[] = [EvaluationOptions.VeryImportant, EvaluationOptions.Important]
    const evaluationStats: [EvaluationOptions, number][] = evaluationStatOptions
        .map((option) => [option, evaluationValues.filter((val: number) => val === option).length] as [EvaluationOptions, number])
        .filter(([_, count]) => count > 0)

    const nEvals = evaluationValues.length
    const headerText = "Evaluation Preview" + (nEvals > 0 ? ` of ${nEvals} features` : '')

    return (
        <LayoutPopup
            isOpen={isOpen}
            onClose={onClose ?? voidFn}
            width="80rem"
            height="50rem"
            header={headerText}
            footer={
                <FooterRow>
                    <div>
                        {evaluationStats.map(([option, count]) => <p key={`evaluation-${option}`}>{count} {EVALUATION_OPTION_TITLES[option]} features</p>)}
                    </div>
                    <SaveBtn onClick={onSaveClick}>Save</SaveBtn>
                </FooterRow>
            }
        >
            <Wrapper>
                {evaluation !== null ? Object.entries(evaluation).map(([key, value]) =>
                    <EvaluationRow key={`${key}-evaluation`}>
                        <strong key={`${key}-eval-key`}>{key}</strong>
                        <select value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onEvaluate(key, event)} key={`${key}-eval-select`}>
                            {Object.entries(EVALUATION_OPTION_TITLES).map(([evalKey, evalValue]) =>
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
