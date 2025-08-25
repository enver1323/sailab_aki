import styled from "styled-components";

import React, { useEffect, useState } from "react";
import { MdOutlineSearch, MdStarRate, MdDoneAll } from "react-icons/md";
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';

import Toggle from "@/components/global/atoms/Toggle";
import "react-toggle/style.css";
import Title from "../global/title";
import Table from "@/components/tables/atomic/Table";
import { PatientInfoType, PatientTreatment } from "@/types/patientTypes";
import { Department } from "@/types/department";
import {
  usePatientInterestMutation,
  usePatientRecoverMutation,
  usePatientRemoveMutation,
  usePatientTableData,
  usePatientUpdateMutation,
} from "@/hooks/queries/usePatientTableData";
import AsyncBoundary from "../utils/AsyncBoundary";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import AkiIndicator from "../tables/atomic/AkiIndicator";
import { toKOLocaleString } from "@/utils/date/dateToString";
import Spacer from "../utils/spacer";
import { useNavigate } from "react-router-dom";
import FileUploadModal from "../popup/FileUploadPopup";
import { FileUploadHandlerEvent } from "primereact/fileupload";
import Pagination from "@/components/global/atoms/Pagination";
import { useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Response } from "@/types/responses";
import { useAuth } from "@/hooks/useAuth";

const ListWrapper = styled.div``;

const UIRibbon = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LeftSearchWrapper = styled.div`
  margin: 5px 0;
  display: flex;
  align-items: center;

  gap: 15px;
`;

const SearchBarWrapper = styled.div`
  position: relative;
  width: min(250px, max(20vw, 150px));

  & > .search-input {
    border: solid 3px ${(props) => props.theme.primary};
    padding: 4px 30px 4px 8px;
    width: 100%;
    height: 35px;
  }

  & > .search-input-icon {
    position: absolute;
    right: 10px;
    top: 16px;
    color: ${(props) => props.theme.font.color.secondary};
  }
`;

const ToggleWrapper = styled.div`
  padding-top: 7px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToggleText = styled.p<{ toggle: boolean }>`
  color: ${(props) =>
    props.toggle ? props.theme.font.color.accent : props.theme.font.color.secondary};
  font-weight: ${(props) => props.theme.font.weight.semibold};
  font-size: ${(props) => props.theme.font.size.s};
`;

const AddDataButton = styled.button`
  padding: 10px 20px;
  margin: 0 10px;
  background: ${(props) => props.theme.primary};

  color: #ffffff;
  font-weight: ${(props) => props.theme.font.weight.semibold};
  font-size: ${(props) => props.theme.font.size.s};
`;

const RightDataAddWrapper = styled.div``;

const LastUpdatedText = styled.p`
  color: ${(props) => props.theme.font.color.secondary_accent};
  font-weight: ${(props) => props.theme.font.weight.normal};
  font-size: ${(props) => props.theme.font.size.s};

  text-align: right;
  width: 100%;

  padding: 5px 10px;
`;

const NumberOfPatientsQueried = styled.p`
  color: ${(props) => props.theme.font.color.secondary};
  font-weight: ${(props) => props.theme.font.weight.normal};
  font-size: ${(props) => props.theme.font.size.sm};

  text-align: left;
  padding-left: 3px;
  width: 100%;
`;

const FocusText = styled.span`
  color: ${(props) => props.theme.font.color.accent};
`;

const StyledRIStarFill = styled(MdStarRate)`
  cursor: pointer;

  &:hover {
    filter: brightness(0.2);
  }
`;

const CellText = styled.p``;

const DetailButton = styled.button`
  border-radius: 0;
  border: solid 1px #9c9c9c;
  padding: 8px 33px;

  color: #9c9c9c;
  background: white;

  &:hover {
    filter: brightness(0.8);
  }
`;

const ViewDetailButtonComponent: React.FC<{ patientMedicalRecordID: number; }> = ({
  patientMedicalRecordID,
}) => {
  const navigate = useNavigate();
  return (
    <DetailButton
      onClick={() => navigate(`/predictions/dashboard/${patientMedicalRecordID}`)}
    >
      자세히 보기
    </DetailButton>
  );
};

const RemoveButtonComponent: React.FC<{ patientMedicalRecordID: number }> = ({
  patientMedicalRecordID
}) => {
  const mutation = usePatientRemoveMutation()
  const { user } = useAuth();
  const onClick = () => {
    if (user?.isAdmin) mutation.mutate({ patientMedicalRecordID })
  }
  return <DetailButton onClick={onClick}>
    삭제
  </DetailButton>
}

const RecoverButtonComponent: React.FC<{ patientMedicalRecordID: number }> = ({
  patientMedicalRecordID
}) => {
  const mutation = usePatientRecoverMutation()
  const { user } = useAuth();
  const onClick = () => {
    if (user?.isAdmin) mutation.mutate({ patientMedicalRecordID })
  }
  return <DetailButton onClick={onClick}>
    다시 덮다
  </DetailButton>
}

type TreatmentSelectProps = {
  patientMedicalRecordID: number,
  treatment?: PatientTreatment | null
}
const TreatmentSelectComponent: React.FC<TreatmentSelectProps> = ({
  patientMedicalRecordID, treatment
}) => {
  const { user } = useAuth();
  const mutation = usePatientUpdateMutation();
  const [curTreatment, setCurTreatment] = useState<PatientTreatment | null>(treatment ?? null);

  const isAdmin = user?.isAdmin as boolean

  const onChange = (e: DropdownChangeEvent) => {
    const newTreatment = e.value
    console.log({ newTreatment, treatment })
    if (!isAdmin || newTreatment === treatment) return;
    setCurTreatment(newTreatment)
    mutation.mutate({ patientMedicalRecordID, data: { treatment: newTreatment } })
  }

  const treatmentTypes = [
    { label: 'Test', value: null },
    { label: 'Control', value: 'control' },
    { label: 'Experiment', value: 'experimental' },
  ]

  return (
    <Dropdown value={treatment ?? null} onChange={onChange} options={treatmentTypes} disabled={!isAdmin}
      placeholder="Select Treatment" className="w-full md:w-14rem" />
  )
}

const StarComponent: React.FC<{ starred: boolean; patientID: number; onClick: () => void }> = (
  props
) => {
  return <StyledRIStarFill onClick={props.onClick} color={props.starred ? "#02348B" : "#C4C4C4"} />;
};

const columnHelper = createColumnHelper<PatientInfoType>();

const columns: ColumnDef<PatientInfoType, any>[] = [
  columnHelper.accessor("is_starred", {
    enableSorting: false,
    header: "",
    cell: (val) => {
      const mutation = usePatientInterestMutation();
      const patientID = val.row.original.patient.id;
      const handleClick = () => {
        mutation.mutate({ patientID });
      };

      return <StarComponent starred={val.getValue()} patientID={patientID} onClick={handleClick} />;
    },
  }),
  columnHelper.accessor("patient.external_id", {
    header: "환자번호",
    cell: (val) => (
      <CellText>{val.getValue()}</CellText>
    ),
  }),
  columnHelper.accessor("patient.name", {
    header: "환자명",
    cell: (val) => <CellText>{val.getValue()}</CellText>,
  }),
  columnHelper.accessor("departments", {
    header: "진료과",
    cell: (val) => (
      <CellText>{(val.getValue() ?? []).map((dep: Department) => dep.name).join(", ")}</CellText>
    ),
  }),
  columnHelper.accessor("reference_date", {
    header: "입원일자",
    cell: (val) => <CellText>{toKOLocaleString(new Date(val.getValue()), true)}</CellText>,
  }),
  columnHelper.accessor("previous_actual_state", {
    header: "AKI 기발생여부",
    cell: (val) => (
      <CellText style={{ fontWeight: "bold" }}>{val.getValue() ? "발생" : "미발생"}</CellText>
    ),
  }),
  columnHelper.accessor("prediction_state", {
    header: "AKI 발생예측",
    cell: (val) => <AkiIndicator akiType={val.getValue()} />,
  }),
  columnHelper.accessor("treatment", {
    header: "Treatment",
    cell: (val) => {
      const { user } = useAuth();
      const patientMedicalRecordID = val.row.original.id

      return (
        user?.isAdmin ? <TreatmentSelectComponent
          patientMedicalRecordID={patientMedicalRecordID}
          treatment={val.getValue()}
        /> : (val.getValue() ?? 'Test')
      )
    }
  }),
  columnHelper.display({
    header: "자세히 보기",
    cell: (val) => {
      const { user } = useAuth();
      const patientMedicalRecordID = val.row.original.id
      return (
        <>
          <ViewDetailButtonComponent
            patientMedicalRecordID={patientMedicalRecordID}
          />
          {
            user?.isAdmin ? (
              val.row.original.is_deleted ? <RecoverButtonComponent
                patientMedicalRecordID={patientMedicalRecordID}
              /> : <RemoveButtonComponent
                patientMedicalRecordID={patientMedicalRecordID}
              />) : null
          }
        </>
      )
    },
  }),
  columnHelper.accessor("is_viewed", {
    header: "Viewed",
    cell: (val) => (val.getValue() ? <MdDoneAll /> : <></>),
  }),
];

const PatientTableWrapper = styled.div``;

const StyledTable = styled(Table<PatientInfoType>)`
  & tr {
    border-bottom: solid 1px #dfdfdf;
    padding: 20px 0;
  }
`;

type PatientListViewerProps = {
  fileUploadMutation: (
    onSuccess?: (response: Response) => void,
    onError?: (err: AxiosError<Response>) => void
  ) => UseMutationResult<Response, AxiosError<Response, any>, File[], unknown>;
  viewType: "all" | "interests";
  startDate?: string | null;
  endDate?: string | null;
};

const PatientListViewer: React.FC<PatientListViewerProps> = ({
  viewType,
  fileUploadMutation,
  startDate,
  endDate,
}) => {
  const titleString = {
    all: "모든 환자 조회",
    interests: "관심 환자 조회",
  };
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [uploadPopupOpen, setUploadPopupOpen] = React.useState<boolean>(false);
  const [fileUploadInProgress, setFileUploadInProgress] = React.useState<boolean>(false);
  useEffect(() => {
    if (fileUploadInProgress === false) onPopupClose();
  }, [fileUploadInProgress]);

  const onPopupClose = () => {
    if (fileUploadInProgress) {
      if (window.confirm("파일 업로드가 진행 중입니다. 정말 닫으시겠습니까?"))
        setUploadPopupOpen(false);
    } else setUploadPopupOpen(false);
  };

  const [searchFilter, setSearchFilter] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const [showOnlyAKIPatients, setShowOnlyAKIPatients] = React.useState<boolean>(false);

  const { data, isLoading, isError } = usePatientTableData(
    viewType,
    page,
    searchFilter,
    showOnlyAKIPatients,
    startDate,
    endDate
  );

  const [lastUpdatedTime, setLastUpdatedTime] = React.useState<Date>(new Date());

  const onFileUploadSuccess = () => {
    setFileUploadInProgress(false);
    queryClient.invalidateQueries({ queryKey: ["patientInfo"] });
  };

  const mutation = fileUploadMutation(onFileUploadSuccess);
  const uploadFiles = (event: FileUploadHandlerEvent) => {
    setFileUploadInProgress(true);
    mutation.mutate(event.files);
  };

  React.useEffect(() => {
    setLastUpdatedTime(new Date());
  }, [data]);

  return (
    <ListWrapper>
      <AsyncBoundary isLoading={data === undefined || isLoading} isError={isError}>
        {data?.items && (
          <>
            <Title>{titleString[viewType]}</Title>
            <UIRibbon>
              <LeftSearchWrapper>
                <SearchBarWrapper>
                  <input
                    className={"search-input"}
                    value={searchFilter}
                    onChange={(e) => {
                      setSearchFilter(e.target.value);
                    }}
                    placeholder={"환자명/환자번호로 검색"}
                  />
                  <MdOutlineSearch className={"search-input-icon"} size={16} />
                </SearchBarWrapper>
                <ToggleWrapper>
                  <Toggle
                    toggled={showOnlyAKIPatients}
                    setToggled={(e) => setShowOnlyAKIPatients(!showOnlyAKIPatients)}
                  />
                  <ToggleText toggle={showOnlyAKIPatients}>발생예측 환자만 조회</ToggleText>
                </ToggleWrapper>
              </LeftSearchWrapper>
              {
                user?.isAdmin ?
                  <RightDataAddWrapper>
                    <AddDataButton onClick={() => setUploadPopupOpen(true)}>데이터 추가</AddDataButton>
                  </RightDataAddWrapper> : null
              }
            </UIRibbon>
            <LastUpdatedText>
              최근 업데이트:{" "}
              {lastUpdatedTime.toLocaleDateString() + " " + lastUpdatedTime.toLocaleTimeString()}
            </LastUpdatedText>
            <NumberOfPatientsQueried>
              <FocusText>총 {data?.pagination.total.toString() || ""} 명</FocusText>의 데이터가
              있습니다 (검색에 의해 {data?.items.length}명 표시 중)
            </NumberOfPatientsQueried>
            <Spacer height={20} />
            <PatientTableWrapper>
              <StyledTable
                tableOptions={{
                  data: (data?.items ?? []).map((item) => ({
                    ...item, id: item.id
                  })),
                  columns,
                  getCoreRowModel: getCoreRowModel<PatientInfoType>(),
                  getSortedRowModel: getSortedRowModel<PatientInfoType>(),
                }}
              />
            </PatientTableWrapper>
            <Pagination
              page={page}
              perPage={data?.pagination.per_page}
              onPageChange={setPage}
              total={data?.pagination.total}
            />
          </>
        )}
      </AsyncBoundary>
      <FileUploadModal
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        multiple={true}
        uploadHandler={uploadFiles}
        isOpen={uploadPopupOpen}
        onCloseHandler={onPopupClose}
        onFileUploadStateChange={(isUploading: boolean) => setFileUploadInProgress(isUploading)}
      />
    </ListWrapper>
  );
};

export default PatientListViewer;
