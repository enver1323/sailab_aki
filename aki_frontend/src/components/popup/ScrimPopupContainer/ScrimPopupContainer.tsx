import React, { ReactNode } from "react"
import styled, { css } from "styled-components"
import PopupPortal from "./PopupPortal"

const Container = styled.div<{ isOpen: boolean }>`
  position: fixed;
  z-index: 999999;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(33, 33, 33, 0.6);
  display: flex;
  padding: 40px 0px;
  justify-content: center;
  align-items: center;

  ${({ isOpen }) =>
    isOpen
      ? ""
      : css`
          display: none;
        `}
`

export default function ScrimPopupContainer({
  children = undefined,
  isOpen,
}: {
  children: ReactNode
  isOpen: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  return (
    <PopupPortal>
      <Container isOpen={isOpen} ref={ref} data-testid="popupContainer">
        {children}
      </Container>
    </PopupPortal>
  )
}
