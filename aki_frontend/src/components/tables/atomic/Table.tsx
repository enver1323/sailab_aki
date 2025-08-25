import React from "react";
import styled, { css } from "styled-components";

import { useReactTable, TableOptions, flexRender } from "@tanstack/react-table";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  /* background-color: white; */
  padding: 0;
  border-radius: 4px;
  width: 100%;
  justify-content: space-between;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  border-spacing: 0;
`;

const StyledHead = styled.thead``;

const StyledBody = styled.tbody``;

const StyledTableRow = styled.tr`
  /* background-color: #fff; */
  text-align: center;
  position: relative;
`;

export interface TableHeaderOptionalStyles {
  padding?: string;
  alignText?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  wordBreak?: string;
  sortable?: boolean;
}

const StyledTableHeader = styled.th<TableHeaderOptionalStyles>`
  padding: ${(props) => (props.padding != null ? props.padding : "6px")};
  text-align: ${(props) => (props.alignText ? props.alignText : "center")};
  width: ${(props) => (props.width != null && props.width > 0 ? `${props.width}px` : "auto")};
  ${(props) => (props.minWidth != null ? `min-width: ${props.minWidth}px` : null)};
  ${(props) => (props.maxWidth != null ? `max-width: ${props.maxWidth}px` : null)};
  ${(props) => (props.wordBreak != null ? `word-break: ${props.wordBreak}` : null)};
  box-sizing: border-box;
  font-size: 14px;
  font-weight: 500;
  color: #222222;

  border-bottom: solid 1px #dfdfdf;
  border-top: solid 1px #dfdfdf;
  height: 58px;

  color: #9c9c9c;

  ${({ sortable }) =>
    sortable
      ? css`
          cursor: pointer;
        `
      : ``}
`;

const StyledTableBodyRow = styled.tr<{
  isRowClickable?: boolean;
}>`
  /* background-color: #fff; */
  /* font-family: "Noto Sans KR", sans-serif; */
  font-size: 14px;
  text-align: center;
  /* position: relative; */
  transition: ease 100ms background-color;

  ${({ isRowClickable }) =>
    isRowClickable
      ? css`
          &:hover {
            cursor: pointer;
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }
        `
      : ""}
`;

const StyledTableDataCell = styled.td<{
  padding?: string;
  align?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  wordBreak?: string;
}>`
  padding: ${(props) => (props.padding != null ? props.padding : "11px")};
  text-align: ${(props) => (props.align ? props.align : "center")};
  ${(props) => (props.wordBreak != null ? `word-break: ${props.wordBreak}` : null)};
  width: ${(props) => (props.width != null && props.width > 0 ? `${props.width}px` : "auto")};
  ${(props) => (props.minWidth != null ? `min-width: ${props.minWidth}px` : null)};
  ${(props) => (props.maxWidth != null ? `max-width: ${props.maxWidth}px` : null)};
  vertical-align: baseline;
  box-sizing: border-box;
`;

export interface ITableProps<T> {
  tableOptions: TableOptions<T>;
  isLoading?: boolean;
  isRowClickable?: boolean;
  onClickRow?: (index: number) => void;
  headerStyles?: TableHeaderOptionalStyles;
  headerClassName?: string;
  renderIfEmpty?: React.ReactNode;
  className?: string;
}

export default function Table<T>(props: ITableProps<T>) {
  const table = useReactTable<T>({
    ...props.tableOptions,
    defaultColumn: { minSize: 0, size: 0 },
    manualPagination: true,
  });

  return (
    <StyledContainer className={props.className}>
      {props.isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <StyledTable>
            <StyledHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <StyledTableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <StyledTableHeader
                      {...props.headerStyles}
                      key={header.id}
                      style={{ width: header.getSize() === 0 ? "auto" : header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                      sortable={header.column.getCanSort()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === "asc" ? (
                          <BiChevronUp />
                        ) : (
                          <BiChevronDown />
                        )
                      ) : (
                        <></>
                      )}
                    </StyledTableHeader>
                  ))}
                </StyledTableRow>
              ))}
            </StyledHead>
            <StyledBody>
              {table.getRowModel().rows.map((row) => (
                <StyledTableBodyRow
                  key={row.id}
                  isRowClickable={props.isRowClickable}
                  onClick={(_) => {
                    if (props.isRowClickable && props.onClickRow) props.onClickRow(row.index);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <StyledTableDataCell key={`${row.id}-${cell.id}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </StyledTableDataCell>
                  ))}
                </StyledTableBodyRow>
              ))}
            </StyledBody>
          </StyledTable>
        </>
      )}
      {table.getRowModel().rows.length === 0 && props.renderIfEmpty}
    </StyledContainer>
  );
}
