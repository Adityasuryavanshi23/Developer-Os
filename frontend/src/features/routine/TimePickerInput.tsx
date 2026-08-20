import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"

interface Props {
  value: string        // "HH:MM" 24h
  onChange: (val: string) => void
}

const HOURS   = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

function pad(n: number) { return n.toString().padStart(2, "0") }

function to12h(h: number, m: number) {
  const ampm = h >= 12 ? "PM" : "AM"
  return `${h % 12 || 12}:${pad(m)} ${ampm}`
}

export default function TimePickerInput({ value, onChange }: Props) {
  const [open, setOpen]     = useState(false)
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 })
  const triggerRef          = useRef<HTMLButtonElement>(null)
  const popupRef            = useRef<HTMLDivElement>(null)
  const hourRef             = useRef<HTMLDivElement>(null)
  const minRef              = useRef<HTMLDivElement>(null)

  const [h, m] = value.split(":").map(Number)

  // Position popup below trigger using getBoundingClientRect
  const openPicker = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  rect.left   + window.scrollX,
      width: rect.width,
    })
    setOpen(true)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Scroll selected into view on open
  useEffect(() => {
    if (!open) return
    setTimeout(() => {
      hourRef.current?.querySelector<HTMLElement>("[data-sel]")?.scrollIntoView({ block: "center", behavior: "smooth" })
      minRef.current?.querySelector<HTMLElement>("[data-sel]")?.scrollIntoView({ block: "center", behavior: "smooth" })
    }, 40)
  }, [open])

  function pickH(newH: number) { onChange(`${pad(newH)}:${pad(m)}`) }
  function pickM(newM: number) { onChange(`${pad(h)}:${pad(newM)}`); setOpen(false) }

  const popup = open && createPortal(
    <div
      ref={popupRef}
      style={{
        position:  "absolute",
        top:       pos.top,
        left:      pos.left,
        minWidth:  Math.max(pos.width, 160),
        zIndex:    99999,
        background: "rgba(0,8,24,0.99)",
        border:    "1px solid rgba(0,200,255,0.28)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.85)",
        display:   "flex",
        overflow:  "hidden",
        fontFamily: "monospace",
      }}
    >
      {/* Hours */}
      <div style={{ flex: 1, borderRight: "1px solid rgba(0,200,255,0.08)" }}>
        <div style={{ color: "#a0c4e0", fontSize: "0.58rem", textAlign: "center", padding: "5px 0", borderBottom: "1px solid rgba(0,200,255,0.08)", letterSpacing: "0.1em" }}>HH</div>
        <div ref={hourRef} style={{ height: 176, overflowY: "auto", scrollbarWidth: "none" }}>
          {HOURS.map((hr) => (
            <div
              key={hr}
              data-sel={hr === h ? true : undefined}
              onClick={() => pickH(hr)}
              style={{
                padding: "5px 0",
                textAlign: "center",
                fontSize: "0.8rem",
                fontWeight: hr === h ? 700 : 400,
                color:      hr === h ? "#00c8ff" : "#b8d4e8",
                background: hr === h ? "rgba(0,200,255,0.13)" : "transparent",
                borderLeft: `2px solid ${hr === h ? "#00c8ff" : "transparent"}`,
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (hr !== h) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)" }}
              onMouseLeave={(e) => { if (hr !== h) (e.currentTarget as HTMLDivElement).style.background = "transparent" }}
            >
              {pad(hr)}
            </div>
          ))}
        </div>
      </div>

      {/* Minutes */}
      <div style={{ flex: 1 }}>
        <div style={{ color: "#a0c4e0", fontSize: "0.58rem", textAlign: "center", padding: "5px 0", borderBottom: "1px solid rgba(0,200,255,0.08)", letterSpacing: "0.1em" }}>MM</div>
        <div ref={minRef} style={{ height: 176, overflowY: "auto", scrollbarWidth: "none" }}>
          {MINUTES.map((mn) => (
            <div
              key={mn}
              data-sel={mn === m ? true : undefined}
              onClick={() => pickM(mn)}
              style={{
                padding: "5px 0",
                textAlign: "center",
                fontSize: "0.8rem",
                fontWeight: mn === m ? 700 : 400,
                color:      mn === m ? "#00c8ff" : "#b8d4e8",
                background: mn === m ? "rgba(0,200,255,0.13)" : "transparent",
                borderLeft: `2px solid ${mn === m ? "#00c8ff" : "transparent"}`,
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (mn !== m) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)" }}
              onMouseLeave={(e) => { if (mn !== m) (e.currentTarget as HTMLDivElement).style.background = "transparent" }}
            >
              {pad(mn)}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openPicker()}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(0,200,255,0.55)" : "rgba(0,200,255,0.22)"}`,
          borderRadius: 6,
          padding: "0.3rem 0.65rem",
          color: "#e2f0ff",
          fontSize: "0.78rem",
          fontFamily: "monospace",
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "border-color 0.15s",
          boxSizing: "border-box",
          boxShadow: open ? "0 0 0 2px rgba(0,200,255,0.1)" : "none",
        }}
      >
        <span>{to12h(h, m)}</span>
        <span style={{ color: "rgba(0,200,255,0.45)", fontSize: "0.55rem", marginLeft: 4 }}>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {popup}
    </>
  )
}
