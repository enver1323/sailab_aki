import React from "react";
import { DepartmentDetailsResponse } from "@/types/responses";
import { AxiosError } from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import Alert from "@/components/global/atoms/Alert";
import Input from "@/components/global/atoms/Input";
import styled from "styled-components";
import { UseMutationResult } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Department, DepartmentFormPayload } from "@/types/department";

const InputBlock = styled.div`
  margin: 0.5rem 0;
  & label {
    display: block;
    font-size: 0.8em;
  }
  & input {
    width: 100%;
  }
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;

  @media only screen and (min-width: 768px) {
    flex-direction: row;
  }
`;

const Col = styled.div`
  @media only screen and (min-width: 768px) {
    width: 50%;
    padding: 0 1rem;
  }
`;

const SubmitButton = styled.button.attrs({
  type: "submit",
})`
  width: 100%;
  color: white;
  background-color: ${(props) => props.theme.primary};
  padding: 0.75rem;
  border-radius: 5px;
`;

type DepartmentFormData = {
  name: string;
  external_id?: string | null;
  external_label_id?: number | null;
  threshold_freq: number;
  threshold_rare: number;
  threshold_recovery: number;
};

type DepartmentDetailsFormProps = {
  department?: Department;
  mutationGenerator: (
    onSuccess?: (data: Department | Object) => void,
    onError?: (err: AxiosError<DepartmentDetailsResponse>) => void
  ) => UseMutationResult<
    DepartmentDetailsResponse,
    AxiosError<DepartmentDetailsResponse>,
    { department?: Department; data: DepartmentFormPayload }
  >;
};

const DepartmentDetailsForm: React.FC<DepartmentDetailsFormProps> = ({
  department,
  mutationGenerator,
}) => {
  const defaultValues: DepartmentFormData = {
    name: department?.name ?? "",
    external_id: department?.external_id,
    external_label_id: department?.external_label_id,
    threshold_freq: department?.threshold_freq ?? 0.5,
    threshold_rare: department?.threshold_rare ?? 0.5,
    threshold_recovery: department?.threshold_recovery ?? 0.5,
  };

  const {
    register,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormData>({ defaultValues });

  const reportableAttributes: Array<keyof DepartmentFormData> = ["name", "external_id"];

  const navigate = useNavigate();

  const onAPIError = (apiError: AxiosError<DepartmentDetailsResponse>) => {
    const errorResponse = apiError.response?.data.errors ?? {};
    for (const attr of reportableAttributes) {
      if (errorResponse?.[attr])
        setError(attr, { message: (errorResponse?.[attr] ?? []).join(", ") });
    }

    setError("root.serverError", { message: apiError.response?.data.message });
  };
  const onSuccess = () => {
    navigate("/admin/departments");
  };

  const mutation = mutationGenerator(onSuccess, onAPIError);

  const save: SubmitHandler<DepartmentFormData> = (formData) => {
    const data: DepartmentFormPayload = {
      name: formData.name,
      external_id: formData.external_id,
      external_label_id: formData.external_label_id,
      threshold_freq: formData.threshold_freq,
      threshold_rare: formData.threshold_rare,
      threshold_recovery: formData.threshold_recovery,
    };

    mutation.mutate({ department, data });
  };

  return (
    <form onSubmit={handleSubmit(save)}>
      {errors.root && <Alert>{errors.root.serverError.message}</Alert>}
      <Row>
        <Col>
          <InputBlock>
            <label>Name</label>
            <Input {...register("name", { required: "Name is required" })} type="text" />
            {errors.name && <Alert>{errors.name?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>External ID</label>
            <Input {...register("external_id")} type="text" />
            {errors.external_id && <Alert>{errors.external_id?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>External Label ID</label>
            <Input {...register("external_label_id")} type="number" />
            {errors.external_label_id && <Alert>{errors.external_label_id?.message}</Alert>}
          </InputBlock>
        </Col>
        <Col>
          <InputBlock>
            <label>Freq. threshold</label>
            <Input {...register("threshold_freq")} type="number" step="0.001" />
            {errors.threshold_freq && <Alert>{errors.threshold_freq?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>Rare threshold</label>
            <Input {...register("threshold_rare")} type="number" step="0.001" />
            {errors.threshold_rare && <Alert>{errors.threshold_rare?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>Recovery threshold</label>
            <Input {...register("threshold_recovery")} type="number" step="0.001" />
            {errors.threshold_recovery && <Alert>{errors.threshold_recovery?.message}</Alert>}
          </InputBlock>
        </Col>
      </Row>
      <SubmitButton>Submit</SubmitButton>
    </form>
  );
};

export default DepartmentDetailsForm;
