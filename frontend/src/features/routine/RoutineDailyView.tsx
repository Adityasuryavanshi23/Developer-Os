import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  CheckCircle2, SkipForward, AlertCircle,
  Plus, Flame, Target, Clock, TrendingUp, Settings2, RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { routineService } from "./routine.service"
import type { TodayActivity, RoutineCategory, CompletionStatus } from "./routine.service"

// ── Config maps ───────────────────────────────────────────────────────────────

const CAT_COLOR: Record<RoutineCategory, string> = {
  LEARNING: "#00c8ff", WORK: "#a78bfa", COLLEGE: "#34d399",
  FITNESS:  "#f59e0b", HEALTH: "#10b981", PERSONAL: "#e2f0ff",
  FAMILY:   "#f472b6", TRAVEL: "#fb923c", REST: "#94a3b8", CUSTOM: "#64748b",
}

const STATUS_CFG: Record<CompletionStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: "Pending", color: "#a0c4e0", bg: "rgba(160,196,224,0.08)", border: "rgba(160,196,224,0.2)" },
  DONE:    { label: "Done",    color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)"  },
  SKIPPED: { label: "Skipped", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  MISSED:  { label: "Missed",  color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)" },
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#64748b", MEDIUM: "#a0c4e0", HIGH: "#f59e0b", CRITICAL: "#f87171",
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props { onGoToWizard: () => void }

// ── Main Component ────────────────────────────────────────────────────────────
export default function RoutineDailyView({ onGoToWizard }: Props) {
  const qc = useQueryClient()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const { data: today, isLoading } = useQuery({
    queryKey: ["routine", "today"],
    queryFn: routineService.getToday,
    refetchInterval: 60_000,
  })

  const { data: streak } = useQuery({
    queryKey: ["routine", "streak"],
    queryFn: routineService.getStreak,
  })

  const mutation = useMutation({
    mutationFn: async ({ activityId, action }: { activityId: string; action: "done" | "skip" | "missed" | "revert" }) => {
      const date = todayStr()
      if (action === "done")   return routineService.markDone(activityId, date)
      if (action === "skip")   return routineService.markSkipped(activityId, date)
      if (action === "revert") return routineService.revert(activityId, date)
      return routineService.markMissed(activityId, date)
    },

    // ── Optimistic update — UI instantly reacts, no waiting for server ────────
    onMutate: async ({ activityId, action }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ["routine", "today"] })

      // Snapshot current cache (for rollback on error)
      const prev = qc.getQueryData(["routine", "today"])

      const statusMap = { done: "DONE", skip: "SKIPPED", missed: "MISSED", revert: "PENDING" } as const

      // Directly patch the cached today data
      qc.setQueryData(["routine", "today"], (old: any) => {
        if (!old) return old
        return {
          ...old,
          activities: old.activities.map((a: any) =>
            a.id === activityId
              ? {
                  ...a,
                  completion: {
                    ...(a.completion ?? {}),
                    activityId,
                    status: statusMap[action],
                    completedAt: action === "done" ? new Date().toISOString() : null,
                  },
                }
              : a
          ),
          // Recalculate summary instantly
          summary: (() => {
            const acts = old.activities.map((a: any) =>
              a.id === activityId ? { ...a, completion: { status: statusMap[action] } } : a
            )
            const total = acts.length
            const done  = acts.filter((a: any) => a.completion?.status === "DONE").length
            return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
          })(),
        }
      })

      return { prev }
    },

    onSuccess: (_, vars) => {
      // Refetch in background to sync with server (streak etc.)
      qc.invalidateQueries({ queryKey: ["routine", "today"] })
      qc.invalidateQueries({ queryKey: ["routine", "streak"] })
      const msg = { done: "Marked as done! 🎯", skip: "Skipped.", missed: "Marked as missed.", revert: "Reverted to pending." }
      toast.success(msg[vars.action])
      setLoadingKey(null)
    },

    // Rollback on error
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["routine", "today"], ctx.prev)
      toast.error("Action failed. Try again.")
      setLoadingKey(null)
    },
  })

  function act(activityId: string, action: "done" | "skip" | "missed" | "revert") {
    setLoadingKey(`${activityId}-${action}`)
    mutation.mutate({ activityId, action })
  }

  // ── States ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ color: "#a0c4e0", fontSize: "0.85rem", fontFamily: "monospace" }}>Loading your routine…</div>
    </div>
  )

  if (!today) return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "0.75rem" }}>Couldn't load your routine.</div>
      <button onClick={() => qc.invalidateQueries({ queryKey: ["routine", "today"] })}
        style={{ background: "none", border: "1px solid rgba(0,200,255,0.3)", borderRadius: 8, padding: "0.4rem 1rem", color: "#00c8ff", cursor: "pointer", fontSize: "0.8rem" }}>
        Try Again
      </button>
    </div>
  )

  const { activities, summary } = today
  const dateLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div style={{ padding: "1.5rem 1.5rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ color: "#00c8ff", fontSize: "0.68rem", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "0.2rem" }}>TODAY'S ROUTINE</div>
          <div style={{ color: "#e2f0ff", fontSize: "1.25rem", fontWeight: 700 }}>{dateLabel}</div>
        </div>
        <button onClick={onGoToWizard}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.45rem 0.9rem", color: "#a0c4e0", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e2f0ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#a0c4e0")}>
          <Settings2 size={13} /> Edit Routine
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { icon: <Target size={14} color="#00c8ff" />,    label: "Completed",   value: `${summary.done} / ${summary.total}`, color: "#00c8ff" },
          { icon: <TrendingUp size={14} color="#34d399" />, label: "Progress",    value: `${summary.pct}%`,                    color: "#34d399" },
          { icon: <Flame size={14} color="#f59e0b" />,     label: "Streak",      value: streak ? `${streak.currentStreak} days` : "—", color: "#f59e0b" },
          { icon: <Clock size={14} color="#a78bfa" />,     label: "Best Streak", value: streak ? `${streak.longestStreak} days` : "—", color: "#a78bfa" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ flex: "1 1 120px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.3rem" }}>{icon}<span style={{ color: "#a0c4e0", fontSize: "0.67rem" }}>{label}</span></div>
            <div style={{ color, fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${summary.pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ height: "100%", background: summary.pct >= 80 ? "linear-gradient(90deg,#34d399,#00c8ff)" : "linear-gradient(90deg,#00c8ff,#a78bfa)", borderRadius: 99 }} />
        </div>
        <div style={{ color: "#a0c4e0", fontSize: "0.68rem", marginTop: "0.3rem", textAlign: "right" }}>
          {summary.pct >= 80 ? "🔥 On track — great work!" : `${100 - summary.pct}% left to reach 80% goal`}
        </div>
      </div>

      {/* ── Table ── */}
      {activities.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#a0c4e0", fontSize: "0.85rem" }}>
          No activities today.
          <br />
          <button onClick={onGoToWizard}
            style={{ marginTop: "0.75rem", background: "none", border: "1px solid rgba(0,200,255,0.3)", borderRadius: 8, padding: "0.4rem 1rem", color: "#00c8ff", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <Plus size={12} /> Add activities
          </button>
        </div>
      ) : (
        <div style={{ background: "rgba(0,6,18,0.8)", border: "1px solid rgba(0,200,255,0.12)", borderRadius: 12, overflow: "hidden" }}>
          {/* Top accent */}
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,rgba(0,200,255,0.5),transparent)" }} />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>

              {/* ── Table Head ── */}
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,200,255,0.1)" }}>
                  {["Time", "Activity", "Category", "Type", "Priority", "Status", "Actions"].map((h, i) => (
                    <th key={h} style={{
                      padding: "0.75rem 1rem",
                      color: "#a0c4e0",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      textAlign: i === 6 ? "center" : "left",
                      background: "rgba(0,200,255,0.03)",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ── Table Body ── */}
              <tbody>
                {activities.map((activity, idx) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    isLast={idx === activities.length - 1}
                    loadingKey={loadingKey}
                    onAction={act}
                  />
                ))}
              </tbody>

            </table>
          </div>

          {/* Footer count */}
          <div style={{ padding: "0.6rem 1rem", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#a0c4e0", fontSize: "0.68rem" }}>
              {activities.length} activit{activities.length !== 1 ? "ies" : "y"} scheduled today
            </span>
            <span style={{ color: "#a0c4e0", fontSize: "0.68rem", fontFamily: "monospace" }}>
              {summary.done} done · {summary.total - summary.done} remaining
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Activity Row ──────────────────────────────────────────────────────────────
function ActivityRow({ activity, isLast, loadingKey, onAction }: {
  activity: TodayActivity
  isLast: boolean
  loadingKey: string | null
  onAction: (id: string, action: "done" | "skip" | "missed" | "revert") => void
}) {
  const status    = activity.completion?.status ?? "PENDING"
  const cfg       = STATUS_CFG[status]
  const catColor  = CAT_COLOR[activity.category]
  const isDone    = status === "DONE"

  const rowStyle: React.CSSProperties = {
    borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
    background: isDone ? "rgba(52,211,153,0.03)" : "transparent",
    opacity: isDone ? 0.65 : 1,
    transition: "background 0.2s, opacity 0.2s",
  }

  const cellStyle: React.CSSProperties = {
    padding: "0.8rem 1rem",
    verticalAlign: "middle",
    fontSize: "0.82rem",
  }

  return (
    <tr style={rowStyle}
      onMouseEnter={(e) => { if (!isDone) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDone ? "rgba(52,211,153,0.03)" : "transparent" }}
    >

      {/* Time */}
      <td style={cellStyle}>
        <div style={{ color: "#e2f0ff", fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>
          {fmtTime(activity.startTime)} → {fmtTime(activity.endTime)}
        </div>
      </td>

      {/* Activity name */}
      <td style={cellStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Category color bar */}
          <div style={{ width: 3, height: 20, borderRadius: 99, background: catColor, flexShrink: 0 }} />
          <span style={{
            color: isDone ? "#a0c4e0" : "#e2f0ff",
            fontWeight: 600,
            textDecoration: isDone ? "line-through" : "none",
          }}>
            {activity.name}
          </span>
        </div>
        {activity.goalNote && (
          <div style={{ color: "#64748b", fontSize: "0.65rem", marginTop: "0.15rem", paddingLeft: "0.75rem" }}>
            {activity.goalNote}
          </div>
        )}
      </td>

      {/* Category */}
      <td style={cellStyle}>
        <span style={{
          background: `${catColor}15`,
          border: `1px solid ${catColor}30`,
          borderRadius: 20,
          padding: "0.15rem 0.6rem",
          color: catColor,
          fontSize: "0.68rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}>
          {activity.category.charAt(0) + activity.category.slice(1).toLowerCase()}
        </span>
      </td>

      {/* Type */}
      <td style={cellStyle}>
        <span style={{ color: activity.type === "FIXED" ? "#f59e0b" : "#a0c4e0", fontSize: "0.72rem" }}>
          {activity.type === "FIXED" ? "Fixed" : "Flexible"}
        </span>
      </td>

      {/* Priority */}
      <td style={cellStyle}>
        <span style={{
          color: PRIORITY_COLOR[activity.priority],
          fontSize: "0.68rem",
          fontWeight: 600,
          fontFamily: "monospace",
        }}>
          {activity.priority.charAt(0) + activity.priority.slice(1).toLowerCase()}
        </span>
      </td>

      {/* Status badge */}
      <td style={cellStyle}>
        <span style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: 20,
          padding: "0.2rem 0.65rem",
          color: cfg.color,
          fontSize: "0.68rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
        }}>
          {status === "DONE"    && <CheckCircle2 size={10} />}
          {status === "SKIPPED" && <SkipForward size={10} />}
          {status === "MISSED"  && <AlertCircle size={10} />}
          {cfg.label}
        </span>
      </td>

      {/* Actions */}
      <td style={{ ...cellStyle, textAlign: "center" }}>
        {isDone ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.35rem" }}>
            <CheckCircle2 size={16} color="#34d399" />
            <Btn id={activity.id} action="revert" icon={<RotateCcw size={12} />} color="#a0c4e0" title="Undo — mark as pending" loadingKey={loadingKey} onAction={onAction} />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem" }}>
            <Btn id={activity.id} action="done"   icon={<CheckCircle2 size={13} />} color="#34d399" title="Done"   loadingKey={loadingKey} onAction={onAction} />
            <Btn id={activity.id} action="skip"   icon={<SkipForward size={13} />}  color="#f59e0b" title="Skip"   loadingKey={loadingKey} onAction={onAction} />
            <Btn id={activity.id} action="missed" icon={<AlertCircle size={13} />}  color="#f87171" title="Missed" loadingKey={loadingKey} onAction={onAction} />
          </div>
        )}
      </td>
    </tr>
  )
}

// ── Action Button ─────────────────────────────────────────────────────────────
function Btn({ id, action, icon, color, title, loadingKey, onAction }: {
  id: string; action: "done" | "skip" | "missed" | "revert"
  icon: React.ReactNode; color: string; title: string
  loadingKey: string | null
  onAction: (id: string, action: "done" | "skip" | "missed" | "revert") => void
}) {
  const isLoading = loadingKey === `${id}-${action}`
  return (
    <button onClick={() => onAction(id, action)} disabled={isLoading} title={title}
      style={{
        background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 7,
        width: 30, height: 30, cursor: isLoading ? "default" : "pointer",
        color: isLoading ? `${color}50` : color,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = `${color}25` }}
      onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = `${color}12` }}
    >
      {isLoading ? <span style={{ fontSize: 10 }}>…</span> : icon}
    </button>
  )
}
