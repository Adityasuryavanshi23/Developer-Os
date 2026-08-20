import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, CalendarDays, Clock, AlertTriangle, CheckCircle2, Inbox } from "lucide-react"
import type { NotifItem } from "./notifTypes"

interface Props {
  open: boolean
  items: NotifItem[]
  onClose: () => void
  onClear: () => void
  onRemove: (id: string) => void
}

export default function InboxDrawer({ open, items, onClose, onClear, onRemove }: Props) {
  const navigate = useNavigate()

  function handleClick(notif: NotifItem) {
    navigate(notif.route)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Drawer — slides in from right */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "100%", maxWidth: 360,
              zIndex: 301,
              background: "rgba(0,6,20,0.99)",
              borderLeft: "1px solid rgba(0,200,255,0.15)",
              display: "flex", flexDirection: "column",
              boxShadow: "-8px 0 40px rgba(0,0,0,0.6), -1px 0 0 rgba(0,200,255,0.08)",
            }}
          >
            {/* Top accent line */}
            <div style={{
              height: 2, flexShrink: 0,
              background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.7), transparent)",
            }} />

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid rgba(0,200,255,0.08)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "rgba(0,200,255,0.1)",
                  border: "1px solid rgba(0,200,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Inbox size={14} color="#00c8ff" />
                </div>
                <div>
                  <div style={{ color: "#e2f0ff", fontSize: "0.9rem", fontWeight: 700 }}>Inbox</div>
                  <div style={{ color: "#a0c4e0", fontSize: "0.68rem" }}>
                    {items.length} notification{items.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {items.length > 0 && (
                  <button
                    onClick={onClear}
                    style={{
                      background: "none", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#a0c4e0", borderRadius: 6,
                      padding: "0.25rem 0.65rem", fontSize: "0.72rem",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#f87171"
                      e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#a0c4e0"
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
                    }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#a0c4e0", padding: "0.25rem",
                    display: "flex", borderRadius: 6, transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e2f0ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#a0c4e0")}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {items.length === 0 ? (
                /* Empty state */
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", gap: "0.85rem",
                  padding: "2rem",
                }}>
                  <div style={{ opacity: 0.12 }}>
                    <Inbox size={44} color="#00c8ff" />
                  </div>
                  <div style={{ color: "#e2f0ff", fontSize: "0.9rem", fontWeight: 700, textAlign: "center" }}>
                    Your inbox is empty
                  </div>
                  <div style={{ color: "#b8d4e8", fontSize: "0.75rem", textAlign: "center", lineHeight: 1.7 }}>
                    Alerts dismissed with <span style={{ color: "#e2f0ff", fontWeight: 600 }}>"OK, Later"</span> land here.
                  </div>
                  <div style={{ color: "#b8d4e8", fontSize: "0.7rem", textAlign: "center", lineHeight: 1.7 }}>
                    Covers <span style={{ color: "#a78bfa" }}>revisions</span>,{" "}
                    <span style={{ color: "#f87171" }}>missed tasks</span> &{" "}
                    <span style={{ color: "#00c8ff" }}>pending reminders</span>.
                  </div>
                </div>
              ) : (
                <div style={{ padding: "0.75rem" }}>
                  {items.map((notif) => {
                    const Icon = notif.type === "revision" ? Clock
                      : notif.type === "missed_task" ? AlertTriangle
                      : CheckCircle2

                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        style={{
                          background: notif.bg,
                          border: `1px solid ${notif.border}`,
                          borderRadius: 10,
                          marginBottom: "0.6rem",
                          overflow: "hidden",
                        }}
                      >
                        {/* Top row */}
                        <div style={{
                          display: "flex", alignItems: "flex-start",
                          gap: "0.65rem", padding: "0.85rem 0.9rem 0.6rem",
                        }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            flexShrink: 0,
                            background: `${notif.color}18`,
                            border: `1px solid ${notif.color}40`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon size={14} color={notif.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: "#e2f0ff", fontSize: "0.85rem", fontWeight: 600 }}>
                              {notif.title}
                            </div>
                            <div style={{ color: "#b8d4e8", fontSize: "0.72rem", marginTop: "0.1rem", lineHeight: 1.4 }}>
                              {notif.description}
                            </div>
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemove(notif.id) }}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#a0c4e0", padding: "0.1rem",
                              display: "flex", flexShrink: 0, transition: "color 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#a0c4e0")}
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {/* Detail rows */}
                        <div style={{
                          margin: "0 0.9rem 0.7rem",
                          background: "rgba(0,0,0,0.25)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: 7, overflow: "hidden",
                        }}>
                          {notif.details.map((row, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0.3rem 0.75rem",
                                borderBottom: i < notif.details.length - 1
                                  ? "1px solid rgba(255,255,255,0.04)" : "none",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                {i === 0
                                  ? <CalendarDays size={10} color="rgba(180,210,240,0.8)" />
                                  : <div style={{
                                      width: 6, height: 6, borderRadius: "50%",
                                      background: `${notif.color}80`,
                                    }} />
                                }
                                <span style={{ color: "#b8d4e8", fontSize: "0.67rem" }}>
                                  {row.label}
                                </span>
                              </div>
                              <span style={{
                                fontSize: "0.67rem", fontWeight: 500, fontFamily: "monospace",
                                color: row.highlight ? notif.color : "#e2f0ff",
                              }}>
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Go button */}
                        <div style={{ padding: "0 0.9rem 0.85rem" }}>
                          <button
                            onClick={() => handleClick(notif)}
                            style={{
                              width: "100%", height: 34,
                              background: `linear-gradient(90deg, ${notif.color}20, ${notif.color}12)`,
                              border: `1px solid ${notif.color}45`,
                              color: notif.color, borderRadius: 7,
                              fontSize: "0.75rem", fontWeight: 600,
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          >
                            Go to page <ChevronRight size={13} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid rgba(0,200,255,0.06)",
              flexShrink: 0,
            }}>
              <div style={{ color: "#a0c4e0", fontSize: "0.65rem", fontFamily: "monospace", textAlign: "center" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
