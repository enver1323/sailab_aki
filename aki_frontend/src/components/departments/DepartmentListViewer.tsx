import styled from "styled-components";

import React from "react";
import { MdOutlineSearch } from "react-icons/md";

import "react-toggle/style.css";
import Title from "../global/title";
import Table from "@/components/tables/atomic/Table";
import { useDepartmentListData } from "@/hooks/queries/useDepartmentData";
import AsyncBoundary from "../utils/AsyncBoundary";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import Spacer from "../utils/spacer";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/global/atoms/Pagination";
import { Department } from "@/types/department";

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

const AddDataButton = styled.a`
  padding: 10px 20px;
  margin: 0 10px;
  background: ${(props) => props.theme.primary};

  color: #ffffff;
  font-weight: ${(props) => props.theme.font.weight.semibold};
  font-size: ${(props) => props.theme.font.size.s};
`;

const RightDataAddWrapper = styled.div``;


const CellText = styled.p``;

const ViewDetailButton = styled.button`
  border-radius: 0;
  border: solid 1px #9c9c9c;
  padding: 8px 33px;

  color: #9c9c9c;
  background: white;

  &:hover {
    filter: brightness(0.8);
  }
`;

const ViewDetailButtonComponent: React.FC<{ id: number }> = ({ id }) => {
  const navigate = useNavigate();
  return <ViewDetailButton onClick={() => navigate(`/admin/departments/${id}`)}>Edit</ViewDetailButton>;
};

const columnHelper = createColumnHelper<Department>();

const columns: ColumnDef<Department, any>[] = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (val) => <CellText>{val.getValue()}</CellText>,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (val) => <CellText>{val.getValue()}</CellText>,
  }),
  columnHelper.accessor("external_id", {
    header: "External ID",
    cell: (val) => <CellText>{val.getValue()}</CellText>,
  }),
  columnHelper.display({
    header: "Edit",
    cell: (val) => <ViewDetailButtonComponent id={val.row.original.id} />,
  }),
];

const DepartmentTableWrapper = styled.div``;

const StyledTable = styled(Table<Department>)`
  & tr {
    border-bottom: solid 1px #dfdfdf;
    padding: 20px 0;
  }
`;

const DepartmentListViewer: React.FC = () => {
  const [searchFilter, setSearchFilter] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);

  const { data, isLoading, isError } = useDepartmentListData(page, searchFilter);

  const navigate = useNavigate();

  const create = () => {
    navigate("/admin/departments/create");
  };

  return (
    <ListWrapper>
      <AsyncBoundary isLoading={data === undefined || isLoading} isError={isError}>
        {data?.items && (
          <>
            <Title>Departments</Title>
            <UIRibbon>
              <LeftSearchWrapper>
                <SearchBarWrapper>
                  <input
                    className={"search-input"}
                    value={searchFilter}
                    onChange={(e) => {
                      setSearchFilter(e.target.value);
                    }}
                  />
                  <MdOutlineSearch className={"search-input-icon"} size={16} />
                </SearchBarWrapper>
              </LeftSearchWrapper>
              <RightDataAddWrapper>
                <AddDataButton onClick={create}>Create</AddDataButton>
              </RightDataAddWrapper>
            </UIRibbon>
            <Spacer height={20} />
            <DepartmentTableWrapper>
              <StyledTable
                tableOptions={{
                  data: data?.items ?? [],
                  columns,
                  getCoreRowModel: getCoreRowModel<Department>(),
                  getPaginationRowModel: getPaginationRowModel<Department>(),
                  getSortedRowModel: getSortedRowModel<Department>(),
                }}
              />
            </DepartmentTableWrapper>
            <Pagination
              page={page}
              perPage={data?.pagination.per_page}
              onPageChange={setPage}
              total={data?.pagination.total}
            />
          </>
        )}
      </AsyncBoundary>
    </ListWrapper>
  );
};

export default DepartmentListViewer;
