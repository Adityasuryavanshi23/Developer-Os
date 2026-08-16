import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, SkipForward, Trash2, Plus, Brain,
  Loader2, Clock, ChevronDown, ChevronUp, Filter,
} from "lucide-react"
import { revisionService } from "./revision.service"
import { skillService, topicService } from "../learning/learning.service"

// ── Priority config ─────────────────────────────────────────────────────────

const PRIORITIES = [
  { key: "LOW",      label: "Low",      color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
  { key: "MEDIUM",   label: "Medium",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)" },
  { key: "HIGH",     label: "High",     color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.35)" },
  { key: "CRITICAL", label: "Critical", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.4)" },
] as const
type PriorityKey = (typeof PRIORITIES)[number]["key"]

function getPriority(key: string) {
  return PRIORITIES.find((p) => p.key === key) ?? PRIORITIES[1]
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_META = {
  PENDING:   { label: "Pending",   color: "#f59e0b",               icon: Clock },
  COMPLETED: { label: "Done",      color: "#4ade80",               icon: CheckCircle2 },
  SKIPPED:   { label: "Skipped",   color: "rgba(255,255,255,0.3)", icon: SkipForward },
}

// ── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "due",       label: "Due / Overdue" },
  { key: "pending",   label: "Pending" },
  { key: "done",      label: "Done" },
  { key: "skipped",   label: "Skipped" },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((d.getTime() - today.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))

  if (diff < 0)  return `${Math.abs(diff)} day${Math.abs(diff) > 1 ? "s" : ""} overdue`
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function isOverdue(iso: string) {
  return new Date(iso) < new Date(new Date().setHours(0, 0, 0, 0))
}

// Revision number → ordinal label
function revisionLabel(n: number) {
  const s = ["1st", "2nd", "3rd", "4th", "5th", "6th"]
  return (s[n - 1] ?? `${n}th`) + " revision"
}

// ── Main component ───────────────────────────────────────────────────────────

export default function RevisionPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState("due")
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    topicId: "",
    priority: "MEDIUM" as PriorityKey,
    scheduledAt: todayStr(),
  })
  const [formError, setFormError] = useState("")

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: revisions = [], isLoading } = useQuery({
    queryKey: ["revisions"],
    queryFn: revisionService.getAll,
  })

  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: skillService.getAll,
    enabled: showForm,
  })

  const { data: topics = [] } = useQuery({
    queryKey: ["topics"],
    queryFn: topicService.getAll,
    enabled: showForm,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createRevision = useMutation({
    mutationFn: () =>
      revisionService.create({
        topicId: form.topicId,
        priority: form.priority,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisions"] })
      setForm({ topicId: "", priority: "MEDIUM", scheduledAt: todayStr() })
      setShowForm(false)
      setFormError("")
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg ?? "Failed to create revision")
    },
  })

  const completeRevision = useMutation({
    mutationFn: revisionService.complete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revisions"] }),
  })

  const skipRevision = useMutation({
    mutationFn: revisionService.skip,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revisions"] }),
  })

  const deleteRevision = useMutation({
    mutationFn: revisionService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revisions"] }),
  })

  // ── Filtered list ──────────────────────────────────────────────────────────

  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const filtered = revisions.filter((r) => {
    if (filter === "due")     return r.status === "PENDING" && new Date(r.scheduledAt) <= now
    if (filter === "pending") return r.status === "PENDING"
    if (filter === "done")    return r.status === "COMPLETED"
    if (filter === "skipped") return r.status === "SKIPPED"
    return true
  })

  // Stats
  const dueCount     = revisions.filter((r) => r.status === "PENDING" && new Date(r.scheduledAt) <= now).length
  const pendingCount = revisions.filter((r) => r.status === "PENDING").length
  const doneCount    = revisions.filter((r) => r.status === "COMPLETED").length

  // Group topics by skill for the form dropdown
  const topicsBySkill = skills.map((s) => ({
    skill: s,
    topics: topics.filter((t) => t.skillId === s.id),
  })).filter((g) => g.topics.length > 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 760 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h1 style={{ color: "#e2f0ff", fontSize: "1.6rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Revision
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", margin: "0.3rem 0 0" }}>
              Spaced repetition — revise what you've learned
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { setShowForm(!showForm); setFormError("") }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: showForm ? "rgba(124,58,237,0.15)" : "linear-gradient(90deg, #7c3aed, #a78bfa)",
              border: "1px solid rgba(167,139,250,0.35)",
              color: "#fff", borderRadius: 8, padding: "0.5rem 1.1rem",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={15} style={{ transform: showForm ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
            {showForm ? "Cancel" : "Add Revision"}
          </motion.button>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {[
            { label: "Due Today",  value: dueCount,          color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.2)"   },
            { label: "Pending",    value: pendingCount,       color: "#a78bfa", bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.2)"  },
            { label: "Completed",  value: doneCount,          color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)"   },
            { label: "Total",      value: revisions.length,   color: "#00c8ff", bg: "rgba(0,200,255,0.08)",    border: "rgba(0,200,255,0.2)"    },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 10, padding: "0.85rem 1rem",
              display: "flex", flexDirection: "column", gap: "0.25rem",
            }}>
              <span style={{ color: s.color, fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>{s.value}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add Revision form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: "rgba(10,15,40,0.9)",
              border: "1px solid rgba(167,139,250,0.25)",
              borderRadius: 12, padding: "1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ color: "#a78bfa", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Schedule Revision
            </div>

            {/* Topic selector — custom styled */}
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <select
                value={form.topicId}
                onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
                style={{
                  width: "100%", height: 42,
                  background: "rgba(0,10,30,0.8)",
                  border: `1px solid ${form.topicId ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8, padding: "0 2rem 0 0.9rem",
                  color: form.topicId ? "#e2f0ff" : "rgba(255,255,255,0.3)",
                  fontSize: "0.85rem", outline: "none",
                  cursor: "pointer", appearance: "none",
                  colorScheme: "dark",
                  transition: "border-color 0.15s",
                }}
              >
                <option value="" style={{ background: "#0d1b35", color: "rgba(255,255,255,0.4)" }}>— Select a topic —</option>
                {topicsBySkill.map(({ skill, topics: tList }) => (
                  <optgroup key={skill.id} label={skill.name} style={{ background: "#0d1b35", color: "#a78bfa", fontWeight: 700 }}>
                    {tList.map((t) => (
                      <option key={t.id} value={t.id} style={{ background: "#0d1b35", color: "#e2f0ff" }}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {/* Custom arrow */}
              <div style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)", pointerEvents: "none",
              }}>▾</div>
            </div>

            {/* Priority + Date row */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              {/* Priority pills */}
              <div style={{ display: "flex", gap: "0.35rem", flex: 1, flexWrap: "wrap" }}>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                    style={{
                      padding: "0.3rem 0.75rem", borderRadius: 20,
                      border: `1px solid ${form.priority === p.key ? p.border : "rgba(255,255,255,0.07)"}`,
                      background: form.priority === p.key ? p.bg : "transparent",
                      color: form.priority === p.key ? p.color : "rgba(255,255,255,0.2)",
                      fontSize: "0.72rem", fontWeight: form.priority === p.key ? 700 : 400,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Date */}
              <input
                type="date"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                style={{
                  height: 38, background: "rgba(0,10,30,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "0 0.75rem",
                  color: "#e2f0ff", fontSize: "0.8rem",
                  outline: "none", colorScheme: "dark",
                  cursor: "pointer",
                }}
              />
            </div>

            {formError && (
              <div style={{
                marginTop: "0.75rem",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 6, padding: "0.5rem 0.75rem",
                color: "#fca5a5", fontSize: "0.78rem",
              }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                onClick={() => createRevision.mutate()}
                disabled={createRevision.isPending || !form.topicId}
                style={{
                  background: !form.topicId ? "rgba(167,139,250,0.1)" : "linear-gradient(90deg, #7c3aed, #a78bfa)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  color: !form.topicId ? "rgba(255,255,255,0.2)" : "#fff",
                  borderRadius: 8, padding: "0 1.25rem", height: 38,
                  fontSize: "0.82rem", fontWeight: 600,
                  cursor: createRevision.isPending || !form.topicId ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  transition: "all 0.15s",
                }}
              >
                {createRevision.isPending && <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />}
                {createRevision.isPending ? "Scheduling..." : "Schedule Revision"}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError("") }}
                style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.3)", borderRadius: 8,
                  padding: "0 0.85rem", height: 38,
                  fontSize: "0.82rem", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "0.3rem 0.8rem", borderRadius: 20,
              border: `1px solid ${filter === f.key ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.07)"}`,
              background: filter === f.key ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.02)",
              color: filter === f.key ? "#a78bfa" : "rgba(255,255,255,0.35)",
              fontSize: "0.76rem", fontWeight: filter === f.key ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}
          >
            <Filter size={10} />
            {f.label}
            {f.key === "due" && dueCount > 0 && (
              <span style={{
                background: "#f59e0b", color: "#000",
                borderRadius: "50%", width: 16, height: 16,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: 700,
              }}>
                {dueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Revision list */}
      {isLoading ? (
        <LoadingRows />
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} onAdd={() => setShowForm(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <AnimatePresence>
            {filtered.map((revision, i) => {
              const priority    = getPriority(revision.priority)
              const statusMeta  = STATUS_META[revision.status]
              const StatusIcon  = statusMeta.icon
              const overdue     = revision.status === "PENDING" && isOverdue(revision.scheduledAt)
              const isCompleted = revision.status === "COMPLETED"
              const isSkipped   = revision.status === "SKIPPED"
              const isExpanded  = expandedId === revision.id

              return (
                <motion.div
                  key={revision.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: isCompleted
                      ? "rgba(74,222,128,0.04)"
                      : overdue
                        ? "rgba(248,113,113,0.04)"
                        : "rgba(0,10,30,0.6)",
                    border: `1px solid ${
                      isCompleted ? "rgba(74,222,128,0.15)"
                        : overdue  ? "rgba(248,113,113,0.25)"
                        : "rgba(167,139,250,0.12)"
                    }`,
                    borderLeft: `3px solid ${
                      isCompleted ? "#4ade80"
                        : overdue  ? "#f87171"
                        : priority.color
                    }`,
                    borderRadius: 10, overflow: "hidden",
                  }}
                >
                  {/* Main row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem" }}>
                    {/* Brain icon / status */}
                    <div style={{ color: isCompleted ? "#4ade80" : overdue ? "#f87171" : "#a78bfa", flexShrink: 0 }}>
                      {isCompleted || isSkipped
                        ? <StatusIcon size={18} />
                        : <Brain size={18} />
                      }
                    </div>

                    {/* Info */}
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : revision.id)}
                    >
                      <div style={{
                        color: isCompleted || isSkipped ? "rgba(255,255,255,0.3)" : "#e2f0ff",
                        textDecoration: isCompleted ? "line-through" : "none",
                        fontSize: "0.9rem", fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        transition: "color 0.2s",
                      }}>
                        {revision.topic.name}
                        <span style={{
                          marginLeft: "0.5rem",
                          color: "#a78bfa", fontSize: "0.7rem",
                          background: "rgba(167,139,250,0.1)",
                          border: "1px solid rgba(167,139,250,0.2)",
                          borderRadius: 10, padding: "0.1rem 0.4rem",
                        }}>
                          {revisionLabel(revision.revisionNo)}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "0.7rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>
                          📚 {revision.topic.skill.name}
                        </span>
                        <span style={{
                          color: overdue ? "#f87171" : "rgba(255,255,255,0.28)",
                          fontSize: "0.72rem", fontWeight: overdue ? 600 : 400,
                        }}>
                          📅 {formatDate(revision.scheduledAt)}
                        </span>
                        <span style={{ color: statusMeta.color, fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          <StatusIcon size={11} />
                          {statusMeta.label}
                        </span>
                        <span style={{ color: priority.color, fontSize: "0.72rem" }}>
                          ⬡ {priority.label}
                        </span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : revision.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.2)", padding: "0.2rem", flexShrink: 0,
                        display: "flex", alignItems: "center", transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteRevision.mutate(revision.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.12)", padding: "0.2rem", flexShrink: 0,
                        display: "flex", alignItems: "center", transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.12)"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          padding: "0.7rem 1rem 0.85rem",
                          display: "flex", gap: "0.5rem", flexWrap: "wrap",
                        }}>
                          {/* Complete */}
                          {revision.status === "PENDING" && (
                            <RevActionBtn
                              label="✓ Done"
                              color="#4ade80"
                              borderColor="rgba(74,222,128,0.3)"
                              bg="rgba(74,222,128,0.08)"
                              loading={completeRevision.isPending && completeRevision.variables === revision.id}
                              onClick={() => completeRevision.mutate(revision.id)}
                            />
                          )}

                          {/* Skip */}
                          {revision.status === "PENDING" && (
                            <RevActionBtn
                              label="→ Skip"
                              color="rgba(255,255,255,0.5)"
                              borderColor="rgba(255,255,255,0.12)"
                              bg="rgba(255,255,255,0.04)"
                              loading={skipRevision.isPending && skipRevision.variables === revision.id}
                              onClick={() => skipRevision.mutate(revision.id)}
                            />
                          )}

                          {/* Info: next revision will be auto-scheduled on complete */}
                          {revision.status === "PENDING" && (
                            <span style={{
                              color: "rgba(167,139,250,0.5)", fontSize: "0.72rem",
                              display: "flex", alignItems: "center", gap: "0.3rem",
                            }}>
                              <Brain size={11} />
                              Completing will auto-schedule next revision
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ color: color ?? "#00c8ff", fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>{label}</div>
    </div>
  )
}

function RevActionBtn({ label, color, borderColor, bg, loading, onClick }: {
  label: string; color: string; borderColor: string; bg: string; loading: boolean; onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      onClick={onClick} disabled={loading}
      style={{
        background: bg, border: `1px solid ${borderColor}`,
        color, borderRadius: 6, padding: "0.3rem 0.85rem",
        fontSize: "0.78rem", fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: "0.3rem",
      }}
    >
      {loading && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
      {label}
    </motion.button>
  )
}

function LoadingRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {[0.9, 0.7, 0.5, 0.3].map((o, i) => (
        <div key={i} style={{
          height: 62, borderRadius: 10,
          background: "rgba(0,10,30,0.6)",
          border: "1px solid rgba(167,139,250,0.08)",
          borderLeft: "3px solid rgba(167,139,250,0.15)",
          display: "flex", alignItems: "center", padding: "0 1rem", gap: "0.75rem",
        }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: `rgba(167,139,250,${o * 0.1})` }} />
          <div style={{ flex: 1, height: 13, borderRadius: 6, background: `rgba(167,139,250,${o * 0.07})`, maxWidth: `${220 - i * 35}px` }} />
          <div style={{ width: 60, height: 20, borderRadius: 10, background: `rgba(167,139,250,${o * 0.05})` }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ filter, onAdd }: { filter: string; onAdd: () => void }) {
  const msg =
    filter === "due"     ? "No revisions due right now — you're on top of it! 🧠" :
    filter === "pending" ? "No pending revisions." :
    filter === "done"    ? "No completed revisions yet." :
    filter === "skipped" ? "No skipped revisions." :
    "No revisions scheduled yet."

  return (
    <div style={{
      textAlign: "center", padding: "3rem 1rem",
      border: "1px dashed rgba(167,139,250,0.18)", borderRadius: 10,
    }}>
      <Brain size={32} color="rgba(167,139,250,0.25)" style={{ margin: "0 auto 0.75rem" }} />
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", margin: "0 0 1rem" }}>{msg}</p>
      {filter === "all" && (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onAdd}
          style={{
            background: "rgba(167,139,250,0.1)",
            border: "1px solid rgba(167,139,250,0.25)",
            color: "#a78bfa", borderRadius: 8,
            padding: "0.5rem 1.2rem", fontSize: "0.82rem",
            fontWeight: 600, cursor: "pointer",
          }}
        >
          + Schedule Revision
        </motion.button>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(0,20,50,0.6)",
  border: "1px solid rgba(167,139,250,0.2)",
  borderRadius: 6, height: 42, padding: "0 0.9rem",
  color: "#e2f0ff", fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box",
}
