import React, { ChangeEvent, MouseEventHandler, useEffect, useState } from "react";
import styled from "styled-components";
import LayoutPopup from "./LayoutPopup";
import { EVALUATION_OPTION_TITLES, EvaluationOptions, EvaluationType } from "@/types/evaluation";
import { FaTimes } from "react-icons/fa";

interface IEvaluationPreviewModalProps {
    isOpen: boolean;
    evaluation: EvaluationType;
    onChange: (key: string, value: number) => void;
    onSave: () => void;
    onClose: VoidFunction;
}

interface ICreatinineEvaluationRowProps {
    evaluation: EvaluationType,
    onChange: (key: string, value: number) => void
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

const Divider = styled.hr`
    margin: 0.5rem 0;
    border: 2px solid rgb(49, 130, 189);
`

const voidFn = () => {
    return;
};

const CREATININE_OPITON_KEYS = {
    'creatinine_value': 'creatinine value',
    'creatinine_dynamics_up': 'creatinine dynamics up',
    'creatinine_dynamics_down': 'creatinine dynamics down',
    'creatinine_fluctuations': 'creatinine fluctuations'
}


const CreatinineEvaluationRow: React.FC<ICreatinineEvaluationRowProps> = ({ evaluation, onChange }) => {
    const evalCreatKeys = Object.entries(evaluation ?? {}).filter(([k, _]) => k in CREATININE_OPITON_KEYS)
    const evalCreatKey = evalCreatKeys.length > 0 ? String(evalCreatKeys[0][0]) : undefined

    const evaluationHasCreatinine = Number(evalCreatKey !== undefined)
    const [isCreatImportant, setIsCreatImportant] = useState(evaluationHasCreatinine)
    const creatImportanceOptions = [EvaluationOptions.NotImportant, EvaluationOptions.Important]
    const creatImportanceVal = creatImportanceOptions[isCreatImportant]

    useEffect(() => {
        setIsCreatImportant(evaluationHasCreatinine)
    }, [evaluationHasCreatinine])

    const updateCreatinine = (event: ChangeEvent<HTMLSelectElement>) => {
        setIsCreatImportant(parseInt(event.target.value))
    }

    console.log({ evalCreatKey });


    const [key, setKey] = useState<string | undefined>(evalCreatKey)
    const evalValue = evalCreatKey !== undefined && evaluation !== null && evalCreatKey in evaluation ? evaluation[evalCreatKey] : EvaluationOptions.NotImportant
    const [val, setVal] = useState<number>(evalValue)

    const onKeyChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setKey(event.target.value)
        setVal(EvaluationOptions.NotImportant)
    }

    const onValChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const eventVal = parseInt(event.target.value)
        setVal(eventVal)

        if (key !== undefined)
            onChange(key, eventVal)
    }

    return <>
        <EvaluationRow>
            <strong key="creatinine-eval-key">creatinine</strong>
            <select value={creatImportanceVal} onChange={updateCreatinine}>
                {creatImportanceOptions.map((option) =>
                    <option value={option} key={`creatinine-eval-select-option-${option}`}>{EVALUATION_OPTION_TITLES[option]}</option>
                )}
            </select>
        </EvaluationRow>
        {isCreatImportant ?
            <EvaluationRow>
                <select value={key} onChange={onKeyChange}>
                    <option value={undefined}>Not Selected</option>
                    {Object.entries(CREATININE_OPITON_KEYS).map(([option, title]) =>
                        <option value={option} key={`creatinine-${option}-eval-select-option-key`}>{title}</option>
                    )}
                </select>
                <select value={val} onChange={onValChange}>
                    {Object.entries(EVALUATION_OPTION_TITLES).map(([evalKey, evalValue]) =>
                        <option value={evalKey} key={`creatinine-eval-select-option-value-${evalKey}`}>{evalValue}</option>
                    )}
                </select>
            </EvaluationRow>
            : ''
        }
    </>
}


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
                <CreatinineEvaluationRow evaluation={evaluation} onChange={onChange} />
                <Divider />
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
