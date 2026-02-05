import React from "react";
import styled from "styled-components";
import Table from "./atomic/Table";
import dayjs from "dayjs";

import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";

import { IBasicPatientInfo, PatientMetaData } from "../../types/patientDetails";
import { ColumnDef, createColumnHelper, getCoreRowModel } from "@tanstack/react-table";
import { PatientInfoType } from "@/types/patientTypes";
import { toKOLocaleString } from "@/utils/date/dateToString";
import { User } from "@/types/user";
import { getGraphEvaluator } from "@/utils/evaluation";
import { GraphClickSyntheticEvent } from "@/types/evaluation";

const StyledTable = styled(Table<PatientMetaData>)`
  & tr {
    border-bottom: solid 1px #dfdfdf;
    padding: 20px 0;
  }

  & td {
    font-weight: 500;
    color: #868686;
    padding: 25px 0;
  }

  & th {
    /* height: 40px; */
    background: #F8F8F8;
    color: black;
  }
`;

const TableWrapper = styled.div``;

const columnHelper = createColumnHelper<PatientMetaData>();

const CellText = styled.p`
  cursor: pointer;
`;

const getColumns = (evaluationHandler: (payload: any, event: GraphClickSyntheticEvent) => void) => {
  const handleClick = (cell: any, event: GraphClickSyntheticEvent) => {
    const column = cell.column.id
    const value = cell.getValue()
    const color = '#000'

    const payload = {
      activePayload: [{
        name: column,
        dataKey: column,
        color: color,
        fill: color,
        stroke: color,
        value: value,
        payload: { [column]: value }
      }]
    }
    
    evaluationHandler(payload, event)
  }

  const columns: ColumnDef<PatientMetaData, any>[] = [
    columnHelper.accessor("p_id", {
      header: "환자번호",
      cell: (val) => <CellText>{val.getValue()}</CellText>,
    }),
    // columnHelper.accessor("patient.name", {
    //   header: "환자명",
    //   cell: (val) => (
    //     <CellText>{val.getValue()}</CellText>
    //   ),
    // }),
    // columnHelper.accessor("reference_date", {
    //   header: "입원 일자",
    //   cell: (val) => <CellText>{toKOLocaleString(new Date(val.getValue()), true)}</CellText>,
    // }),
    // columnHelper.accessor("metadata.date_discharge", {
    //   header: "퇴원 일자",
    //   cell: (val) => (
    //     <CellText>{val.getValue() ? toKOLocaleString(new Date(val.getValue()), true) : '-'}</CellText>
    //   ),
    // }),
    // columnHelper.accessor("metadata.stay_length", {
    //   header: "입원 기간",
    //   cell: (val) => <CellText>{`${val.getValue() ?? 0}일`}</CellText>,
    // }),
    // columnHelper.accessor("updated_at", {
    //   header: "기준 일자",
    //   cell: (val) => <CellText>{dayjs(val.getValue()).format("YYYY.MM.DD")}</CellText>,
    // }),
    // columnHelper.accessor("metadata.admin_room", {
    //   header: "병실",
    //   cell: (val) => <CellText>{`${val.getValue()?.toString()?.padStart(3, "0")}호`}</CellText>,
    // }),
    // columnHelper.accessor("metadata.docs", {
    //   header: "지정의",
    //   cell: (val) => <CellText>{val.getValue() ?? ''}</CellText>,
    // }),
    columnHelper.accessor("age", {
      header: "나이",
      cell: (val) => <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>{val.getValue()}</CellText>,
    }),
    columnHelper.accessor("sex", {
      header: "성별",
      cell: (val) => <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>{val.getValue() == 0 ? "여자" : "남자"}</CellText>,
    }),
    columnHelper.accessor("bmi", {
      header: "BMI",
      cell: (val) => <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>{val.getValue()}</CellText>,
    }),
    columnHelper.accessor("b_egfr", {
      header: "EGFR",
      cell: (val) => <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>{val.getValue()}</CellText>,
    }),
    columnHelper.accessor("b_cr", {
      header: "기저 크레아티닌",
      cell: (val) => <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>{val.getValue()}</CellText>,
    }),
    columnHelper.accessor("department", {
      header: "진료과",
      cell: (val) => <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>{val.getValue()}</CellText>,
    }),
    columnHelper.accessor("icu", {
      header: "중환자실",
      cell: (val) => (
        <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>
          {!!val.getValue() ? <MdOutlineCheckBox /> : <MdOutlineCheckBoxOutlineBlank />}
        </CellText>
      ),
    }),
    columnHelper.accessor("aki", {
      header: "aki",
      cell: (val) => <CellText onClick={(event: GraphClickSyntheticEvent) => handleClick(val, event)}>{val.getValue()}</CellText>,
    }),
  ]
  return columns
};

const PatientBasicInfoTable: React.FC<{ data: PatientMetaData[] }> = ({ data }) => {
  const clickHandler = getGraphEvaluator()
  const columns = getColumns(clickHandler)
  return (
    <TableWrapper>
      <StyledTable
        tableOptions={{
          data,
          columns,
          getCoreRowModel: getCoreRowModel<PatientMetaData>(),
        }}
      />
    </TableWrapper>
  );
};

export default PatientBasicInfoTable;
