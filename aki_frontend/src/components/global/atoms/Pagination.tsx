import React from "react";
import styled from "styled-components"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

const PaginationButton = styled.button`
    background: ${(props) => props.theme.primary};
    color: #ffffff;
    padding: 0.75rem 0.75rem;
    margin: 0.25rem;
    background: ${(props) => props.theme.primary};
    border-radius: 0.25rem;

    color: #ffffff;
    font-weight: ${(props) => props.theme.font.weight.semibold};
    font-size: ${(props) => props.theme.font.size.s};

    &:disabled, &:disabled:hover{
        background: #a7a7a7;
    }

    &:hover {
        background: #1d50a8;
    }
`

type IPaginationProps = {
    page: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void
}

const Pagination: React.FC<IPaginationProps> = ({ page, total, perPage, onPageChange }) => {
    const totalPages = (total / perPage) as number
    const nextAvailable = page < totalPages
    const prevAvailable = page > 1

    return <>
        <PaginationButton disabled={!prevAvailable} onClick={() => onPageChange(page - 1)}><BiChevronLeft/></PaginationButton>
        ...
        <PaginationButton disabled={!nextAvailable} onClick={() => onPageChange(page + 1)}><BiChevronRight/></PaginationButton>
    </>
}

export default Pagination