import React, { useState } from "react";
import styled from "styled-components";
import EvaluationPreviewModal from "../popup/EvaluationPreviewPopup";
import { useEvaluation } from "@/hooks/useEvaluation";
import { EvaluationType } from "@/types/evaluation";
import { useEvaluationEdit } from "@/hooks/queries/useEvaluationData";

const PreviewBtn = styled.button`
    padding: 0.5rem 1rem;
    font-weight: ${(props) => props.theme.font.weight.normal};
    font-size: ${(props) => props.theme.font.size.sm};
`;


export const PatientEvaluationPreview: React.FC<{ patientMedicalRecordId: number }> = ({ patientMedicalRecordId }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const openModal = () => { setIsModalOpen(true) }
    const closeModal = () => { setIsModalOpen(false) }
    const { evaluation, updateEvaluation, setEvaluation } = useEvaluation()

    const onSuccess = (data: EvaluationType) => {
        setEvaluation(data)
    };

    const mutation = useEvaluationEdit(onSuccess);

    const onSave = () => {
        mutation.mutate({ patientMedicalRecordId, data: evaluation })
    }

    return <>
        <PreviewBtn onClick={openModal}>Preview</PreviewBtn>
        <EvaluationPreviewModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onChange={updateEvaluation}
            evaluation={evaluation}
            onSave={onSave}
        />
    </>;
};
