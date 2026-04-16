import React, { useState } from "react";
import styled from "styled-components";
import EvaluationPreviewModal from "../popup/EvaluationPreviewPopup";
import { useEvaluation } from "@/hooks/useEvaluation";
import { EvaluationOptions, EvaluationType } from "@/types/evaluation";
import { useEvaluationEdit } from "@/hooks/queries/useEvaluationData";

const ControlsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
`;

const SelectedFeaturesText = styled.p`
    margin: 0;
    font-size: ${(props) => props.theme.font.size.sm};
    font-weight: ${(props) => props.theme.font.weight.normal};
    color: ${(props) => props.theme.font.color.primary};
    line-height: 1.35;
`;

const ActionButtonsRow = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const SelectedFeatureCount = styled.span<{ isOverLimit: boolean }>`
    color: ${(props) => props.isOverLimit ? props.theme.font.color.error : "inherit"};
`;

const ActionBtn = styled.button`
    padding: 0.5rem 1rem;
    font-weight: ${(props) => props.theme.font.weight.normal};
    font-size: ${(props) => props.theme.font.size.sm};
`;

const MAX_IMPORTANT_FEATURES = 10;

const countSelectedFeatures = (evaluation: EvaluationType): number => Object.values(evaluation ?? {}).filter((value) =>
    value === EvaluationOptions.Important || value === EvaluationOptions.VeryImportant
).length;


export const PatientEvaluationPreview: React.FC<{ patientMedicalRecordId: number }> = ({ patientMedicalRecordId }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const openModal = () => { setIsModalOpen(true) }
    const closeModal = () => { setIsModalOpen(false) }
    const { evaluation, updateEvaluation, syncEvaluationWithServer, resetEvaluation } = useEvaluation()

    const onSuccess = (data: EvaluationType) => {
        syncEvaluationWithServer(data)
        const selectedFeatureCount = countSelectedFeatures(data)
        window.alert(`The selected ${selectedFeatureCount} features are saved successfully!`)
    };

    const mutation = useEvaluationEdit(onSuccess);

    const onSave = () => {
        mutation.mutate({ patientMedicalRecordId, data: evaluation })
    }

    const nEvals = countSelectedFeatures(evaluation)
    const isOverLimit = nEvals > MAX_IMPORTANT_FEATURES

    return <>
        <ControlsWrapper>
            <SelectedFeaturesText>
                You selected <SelectedFeatureCount isOverLimit={isOverLimit}>{nEvals}</SelectedFeatureCount> features. The maximum number of features is {MAX_IMPORTANT_FEATURES}.
            </SelectedFeaturesText>
            <ActionButtonsRow>
                <ActionBtn onClick={resetEvaluation}>Cancel</ActionBtn>
                <ActionBtn onClick={openModal}>Preview</ActionBtn>
            </ActionButtonsRow>
        </ControlsWrapper>
        <EvaluationPreviewModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onChange={updateEvaluation}
            evaluation={evaluation}
            onSave={onSave}
        />
    </>;
};
