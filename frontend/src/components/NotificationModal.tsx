import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X, ChevronRight, Clock, CheckCircle2, AlertTriangle, CalendarDays, Timer } from "lucide-react"
import { revisionService } from "../features/revision/revision.service"
import { taskService } from "../features/tasks/task.service"
import type { NotifItem } from "./notifTypes"

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayEnd() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

function storageKey() {
  return `notif-dismissed-${new Date().toLocaleDateString("en-CA")}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  if (d.getHours() === 0 && d.getMinutes() === 0) return null
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function fmtDateTime(iso: string) {
  const date = fmtDate(iso)
  const time = fmtTime(iso)
  return time ? `${date}, ${time}` : date
}

function isOverdue(iso: string) {
  return new Date(iso) < new Date()
}

function overdueText(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0)  return `${days}d overdue`
  if (hrs > 0)   return `${hrs}h overdue`
  if (mins > 0)  return `${mins}m overdue`
  return "Just now"
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onMoveToInbox: (item: NotifItem) => void
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NotificationModal({ onMoveToInbox }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const { data: revisions = [] } = useQuery({
    queryKey: ["revisions"],
    queryFn: revisionService.getAll,
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "today"],
    queryFn: taskService.getToday,
  })

  // ── Build notification items ───────────────────────────────────────────────
  const notifications: NotifItem[] = []

  const dueRevisions = revisions.filter(
    (r) => r.status === "PENDING" && new Date(r.scheduledAt) <= todayEnd()
  )
  if (dueRevisions.length > 0) {
    const earliest = dueRevisions.reduce((a, b) =>
      new Date(a.scheduledAt) < new Date(b.scheduledAt) ? a : b
    )
    notifications.push({
      id: "due-revisions",
      type: "revision",
      title: `${dueRevisions.length} Revision${dueRevisions.length > 1 ? "s" : ""} Due Today`,
      description: dueRevisions.slice(0, 2).map((r) => r.topic?.name).filter(Boolean).join(", ") +
        (dueRevisions.length > 2 ? ` +${dueRevisions.length - 2} more` : ""),
      details: [
        { label: "Due date",     value: fmtDate(earliest.scheduledAt) },
        { label: "Earliest due", value: fmtDateTime(earliest.scheduledAt) },
        { label: "Topics",       value: `${dueRevisions.length} pending revision${dueRevisions.length > 1 ? "s" : ""}` },
        ...(isOverdue(earliest.scheduledAt)
          ? [{ label: "Status", value: overdueText(earliest.scheduledAt), highlight: true }]
          : [{ label: "Status", value: "Due today" }]
        ),
      ],
      route: "/revision",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.3)",
    })
  }

  const missedTasks = tasks.filter((t) => t.status === "MISSED")
  if (missedTasks.length > 0) {
    const latest = missedTasks.reduce((a, b) =>
      new Date(a.scheduledAt) > new Date(b.scheduledAt) ? a : b
    )
    notifications.push({
      id: "missed-tasks",
      type: "missed_task",
      title: `${missedTasks.length} Task${missedTasks.length > 1 ? "s" : ""} Missed`,
      description: missedTasks.slice(0, 2).map((t) => t.title).join(", ") +
        (missedTasks.length > 2 ? ` +${missedTasks.length - 2} more` : ""),
      details: [
        { label: "Last missed",  value: fmtDateTime(latest.scheduledAt) },
        { label: "Total missed", value: `${missedTasks.length} task${missedTasks.length > 1 ? "s" : ""}` },
        { label: "Status",       value: "Action required", highlight: true },
      ],
      route: "/tasks",
      color: "#f87171",
      bg: "rgba(248,113,113,0.08)",
      border: "rgba(248,113,113,0.3)",
    })
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS")
  if (pendingTasks.length > 0) {
    const next = pendingTasks.find((t) => t.scheduledAt) ?? pendingTasks[0]
    notifications.push({
      id: "pending-tasks",
      type: "pending_task",
      title: `${pendingTasks.length} Task${pendingTasks.length > 1 ? "s" : ""} Pending Today`,
      description: pendingTasks.slice(0, 2).map((t) => t.title).join(", ") +
        (pendingTasks.length > 2 ? ` +${pendingTasks.length - 2} more` : ""),
      details: [
        { label: "Scheduled",    value: fmtDateTime(next.scheduledAt) },
        { label: "Total pending", value: `${pendingTasks.length} task${pendingTasks.length > 1 ? "s" : ""}` },
        { label: "In progress",  value: `${pendingTasks.filter((t) => t.status === "IN_PROGRESS").length} active` },
        { label: "Today",        value: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }) },
      ],
      route: "/tasks",
      color: "#00c8ff",
      bg: "rgba(0,200,255,0.06)",
      border: "rgba(0,200,255,0.25)",
    })
  }

  // ── Show modal once per day ────────────────────────────────────────────────
  useEffect(() => {
    if (notifications.length === 0) return
    if (!localStorage.getItem(storageKey())) {
      const t = setTimeout(() => setOpen(true), 1200)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revisions.length, tasks.length])

  const active = notifications.filter((n) => !dismissed.has(n.id))

  function handleDoItNow(notif: NotifItem) {
    setDismissed((prev) => new Set(prev).add(notif.id))
    if (active.filter((n) => n.id !== notif.id).length === 0) {
      setOpen(false)
      localStorage.setItem(storageKey(), "1")
    }
    navigate(notif.route)
  }

  function handleLater(notif: NotifItem) {
    setDismissed((prev) => new Set(prev).add(notif.id))
    onMoveToInbox(notif)
    if (active.filter((n) => n.id !== notif.id).length === 0) {
      setOpen(false)
      localStorage.setItem(storageKey(), "1")
    }
  }

  function handleDismissAll() {
    setOpen(false)
    localStorage.setItem(storageKey(), "1")
  }

  return (
    <AnimatePresence>
      {open && active.length > 0 && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismissAll}
            className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-[460px] rounded-xl overflow-hidden"
            style={{
              background: "rgba(0,8,24,0.97)",
              border: "1px solid rgba(0,200,255,0.2)",
              boxShadow: "0 0 0 1px rgba(0,200,255,0.08), 0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(0,200,255,0.06)",
            }}
          >
            {/* Top accent line */}
            <div
              className="h-[2px] w-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.8), transparent)" }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-4 pb-3"
              style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.2)" }}
                >
                  <Bell size={14} color="#00c8ff" />
                </div>
                <div>
                  <div className="text-[#e2f0ff] text-[0.9rem] font-bold">Notifications</div>
                  <div className="text-[#a0c4e0] text-[0.7rem]">
                    {active.length} alert{active.length > 1 ? "s" : ""} need your attention
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[#00c8ff] text-[0.68rem] font-mono">
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                  <div className="text-[#a0c4e0] text-[0.62rem]">
                    {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <button
                  onClick={handleDismissAll}
                  className="text-[#a0c4e0] hover:text-white p-1 rounded-md transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification Items */}
            <div className="px-5 py-3 flex flex-col gap-[0.65rem] max-h-[70vh] overflow-y-auto">
              <AnimatePresence>
                {active.map((notif) => {
                  const Icon = notif.type === "revision" ? Clock
                    : notif.type === "missed_task" ? AlertTriangle
                    : CheckCircle2
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg overflow-hidden"
                      style={{ background: notif.bg, border: `1px solid ${notif.border}` }}
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-[0.65rem] px-3 pt-3 pb-2">
                        <div
                          className="w-7 h-7 rounded-[7px] shrink-0 flex items-center justify-center mt-[2px]"
                          style={{ background: `${notif.color}18`, border: `1px solid ${notif.color}40` }}
                        >
                          <Icon size={13} color={notif.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#e2f0ff] text-[0.85rem] font-semibold">{notif.title}</div>
                          <div className="text-[#b8d4e8] text-[0.72rem] mt-[0.1rem] leading-[1.4]">{notif.description}</div>
                        </div>
                      </div>

                      {/* Detail rows */}
                      <div
                        className="mx-3 mb-2 rounded-md overflow-hidden"
                        style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        {notif.details.map((row, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-3 py-[0.35rem]"
                            style={{ borderBottom: i < notif.details.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                          >
                            <div className="flex items-center gap-[0.4rem]">
                              {i === 0 ? <CalendarDays size={10} color="rgba(180,210,240,0.8)" /> :
                               i === 1 ? <Timer size={10} color="rgba(180,210,240,0.8)" /> :
                               <div className="w-[10px] h-[10px] rounded-full" style={{ background: `${notif.color}70` }} />}
                              <span className="text-[#b8d4e8] text-[0.68rem]">{row.label}</span>
                            </div>
                            <span
                              className="text-[0.68rem] font-medium font-mono"
                              style={{ color: row.highlight ? notif.color : "#e2f0ff" }}
                            >
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 px-3 pb-3">
                        <button
                          onClick={() => handleDoItNow(notif)}
                          className="flex-1 h-8 rounded-md text-[0.75rem] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-opacity hover:opacity-80 border"
                          style={{
                            background: `linear-gradient(90deg, ${notif.color}22, ${notif.color}15)`,
                            borderColor: `${notif.color}50`,
                            color: notif.color,
                          }}
                        >
                          Do it now <ChevronRight size={12} />
                        </button>
                        <button
                          onClick={() => handleLater(notif)}
                          className="px-[0.85rem] h-8 rounded-md text-[0.75rem] font-medium text-[#b8d4e8] hover:text-white cursor-pointer transition-colors whitespace-nowrap bg-white/[0.06] border border-white/20"
                        >
                          OK, Later
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              className="px-5 py-2 flex justify-between items-center"
              style={{ borderTop: "1px solid rgba(0,200,255,0.06)" }}
            >
              <span className="text-[#a0c4e0] text-[0.65rem] font-mono">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <button
                onClick={handleDismissAll}
                className="bg-transparent border-none text-[#a0c4e0] hover:text-white text-[0.72rem] cursor-pointer transition-colors"
              >
                Dismiss all
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
