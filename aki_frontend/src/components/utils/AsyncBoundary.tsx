import React from "react"
import styled from "styled-components"
import CircleSpinner from "../spinner/CircleSpinner"

interface IAsyncHandler {
  isLoading: boolean
  isError: boolean
  renderIfLoading?: React.ReactNode
  renderIfError?: React.ReactNode
}

const SpinnerWrapper = styled.div`
  width: 100%;
  height: min(100%, 200px);

  display: flex;
  justify-content: center;
  align-items: center;
`

const AsyncBoundary: React.FC<React.PropsWithChildren<IAsyncHandler>> = (props) => {
  return (
    <>
      {props.isLoading
        ? props.renderIfLoading ?? (
            <SpinnerWrapper>
              <CircleSpinner />
            </SpinnerWrapper>
          )
        : props.isError
        ? props.renderIfError ?? <div>Error</div>
        : props.children ?? <div>Loaded!</div>}
    </>
  )
}

export default AsyncBoundary
