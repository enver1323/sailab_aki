import React from "react"
import { ReactNode, useEffect } from "react"
import ReactDOM from "react-dom"

export const POPUP_PORTAL_ELEMENT_ID = "root-popup"

export default function PopupPortal({ children = undefined }: { children: ReactNode }) {
  const [mounted, setMounted] = React.useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (typeof window === "undefined") return <></>

  return mounted ? (
    ReactDOM.createPortal(
      children,
      document.getElementById(`${POPUP_PORTAL_ELEMENT_ID}`) as HTMLElement,
    )
  ) : (
    <></>
  )
}
