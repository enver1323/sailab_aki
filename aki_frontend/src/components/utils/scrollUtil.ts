/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
function preventDefault(e: any) {
  e.preventDefault()
}

const wrapLogicHof = (element: any) => (e: any) => {
  if (element != null && element.contains(e.target)) {
    e.stopPropagation()
    e.stopImmediatePropagation()
    return false
  }

  preventDefault(e)
}

let supportsPassive = false
try {
  window.addEventListener(
    "test",
    () => null,
    Object.defineProperty({}, "passive", {
      get: function () {
        supportsPassive = true
      },
    }),
  )
} catch (e) {}

const wheelOpt = supportsPassive ? { passive: false } : false
let wheelEvent: any
if (typeof document !== "undefined") {
  wheelEvent = "onwheel" in document.createElement("div") ? "wheel" : "mousewheel"
}

export function disableScroll(element: any) {
  const logic = wrapLogicHof(element)

  document.body.style.overflow = "hidden"

  window.addEventListener("DOMMouseScroll", logic, false)
  window.addEventListener(wheelEvent, logic, wheelOpt)
  window.addEventListener("touchmove", logic, wheelOpt)

  return () => {
    document.body.style.overflow = ""
    window.removeEventListener("DOMMouseScroll", logic, false)
    window.removeEventListener(wheelEvent, logic)
    window.removeEventListener("touchmove", logic)
  }
}
