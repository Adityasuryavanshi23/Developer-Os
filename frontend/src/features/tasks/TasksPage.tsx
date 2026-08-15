import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, CheckCircle2, Clock, Circle, CalendarClock,
  Loader2, AlertTriangle, ChevronDown, ChevronUp, Filter,
} from "lucide-react"
import { taskService, type Task } from "./task.service"

// ── Priority config ────────────────────────────────────────────────────────────

const PRIORITIES = [
  { key: "LOW",      label: "Low",      color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
  { key: "MEDIUM",   label: "Medium",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)" },
  { key: "HIGH",     label: "High",     color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.35)" },
  { key: "CRITICAL", label: "Critical", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.4)" },
] as const

type PriorityKey = (typeof PRIORITIES)[number]["key"]

function getPriority(key: string) {
  return PRIORITIES.find((p) => p.key === key) ?? PRIORITIES[0]
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_META: Record<Task["status"], { label: string; color: string; icon: React.ElementType }> = {
  PENDING:          { label: "Pending",         color: "rgba(255,255,255,0.4)", icon: Circle },
  IN_PROGRESS:      { label: "In Progress",     color: "#f59e0b",               icon: Clock },
  COMPLETED:        { label: "Done",            color: "#4ade80",               icon: CheckCircle2 },
  MISSED:           { label: "Missed",          color: "#f87171",               icon: AlertTriangle },
  CARRIED_FORWARD:  { label: "Carried Forward", color: "#a78bfa",               icon: CalendarClock },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayDateString() {
  // Returns YYYY-MM-DDTHH:mm for datetime-local input (local time, not UTC)
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function toLocalISO(datetimeLocal: string) {
  // Convert datetime-local string (YYYY-MM-DDTHH:mm) to proper ISO
  // by creating a Date from it — JS treats it as local time automatically
  return new Date(datetimeLocal).toISOString()
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const day   = d.getDate()
  const month = d.toLocaleDateString("en-IN", { month: "short" })
  const year  = String(d.getFullYear()).slice(2)
  const dateStr = `${day} ${month} '${year}`   // e.g. "15 Aug '26"

  if (d.toDateString() === today.toDateString())         return `Today · ${dateStr}`
  if (d.toDateString() === tomorrow.toDateString())      return `Tomorrow · ${dateStr}`
  return dateStr
}

function formatTime(iso: string) {
  const d = new Date(iso)
  // If time is midnight UTC (old tasks created without time picker),
  // the minutes+seconds in UTC are all 0 — don't show a misleading time
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return null  // caller will hide the badge
  }
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatWeekday(iso: string) {
  return WEEKDAYS_SHORT[new Date(iso).getDay()]
}

// ── Filter tabs ────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "today",     label: "Today" },
  { key: "pending",   label: "Pending" },
  { key: "done",      label: "Done" },
  { key: "missed",    label: "Missed" },
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState(todayDateString().slice(0, 10))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [changingPriorityId, setChangingPriorityId] = useState<string | null>(null)

  // Live clock in header
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as PriorityKey,
    scheduledAt: todayDateString(),   // datetime-local format: YYYY-MM-DDTHH:mm
  })
  const [formError, setFormError] = useState("")

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: taskService.getAll,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const createTask = useMutation({
    mutationFn: () =>
      taskService.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        scheduledAt: toLocalISO(form.scheduledAt),  // local datetime → ISO (correct timezone)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      setForm({ title: "", description: "", priority: "MEDIUM", scheduledAt: todayDateString() })
      setShowForm(false)
      setFormError("")
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg ?? "Failed to create task")
    },
  })

  const completeTask = useMutation({
    mutationFn: taskService.complete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })

  // For undo-complete, mark-in-progress, and priority change
  const updateTask = useMutation({
    mutationFn: ({ id, status, priority }: { id: string; status?: Task["status"]; priority?: Task["priority"] }) =>
      taskService.update(id, { status, priority }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })

  const rescheduleTask = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      taskService.reschedule(id, new Date(date).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      setReschedulingId(null)
    },
  })

  const deleteTask = useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })

  // ── Filtered tasks ─────────────────────────────────────────────────────────

  // todayStr for filtering — just YYYY-MM-DD part of local date
  const todayStr = new Date().toLocaleDateString("en-CA") // "2025-01-15" format

  const filteredTasks = tasks.filter((t) => {
    if (filter === "today")   return t.scheduledAt.slice(0, 10) === todayStr
    if (filter === "pending") return t.status === "PENDING" || t.status === "IN_PROGRESS"
    if (filter === "done")    return t.status === "COMPLETED"
    if (filter === "missed")  return t.status === "MISSED" || t.status === "CARRIED_FORWARD"
    return true
  })

  // Stats
  const totalToday   = tasks.filter((t) => new Date(t.scheduledAt).toLocaleDateString("en-CA") === todayStr).length
  const doneToday    = tasks.filter((t) => new Date(t.scheduledAt).toLocaleDateString("en-CA") === todayStr && t.status === "COMPLETED").length
  const totalPending = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length
  const totalMissed  = tasks.filter((t) => t.status === "MISSED").length

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 760 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h1 style={{ color: "#e2f0ff", fontSize: "1.6rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Tasks
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", margin: "0.3rem 0 0" }}>
              Plan, track and complete your daily work
            </p>
            {/* Weekday + live clock */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.45rem" }}>
              <span style={{
                color: "#00c8ff", fontSize: "0.72rem", fontWeight: 700,
                background: "rgba(0,200,255,0.08)",
                border: "1px solid rgba(0,200,255,0.18)",
                borderRadius: 6, padding: "0.15rem 0.55rem",
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                {WEEKDAYS_SHORT[now.getDay()]}
              </span>
              <span style={{
                color: "rgba(255,255,255,0.5)", fontSize: "0.72rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6, padding: "0.15rem 0.55rem",
                fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em",
              }}>
                {now.getDate()} {now.toLocaleDateString("en-IN", { month: "short" })} '{String(now.getFullYear()).slice(2)}
              </span>
              <span style={{
                color: "#a78bfa", fontSize: "0.72rem", fontWeight: 600,
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.18)",
                borderRadius: 6, padding: "0.15rem 0.55rem",
                fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em",
              }}>
                {formatTime(now.toISOString())}
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setShowForm(true); setFormError("") }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
              border: "1px solid rgba(0,200,255,0.3)",
              color: "#fff", borderRadius: 8, padding: "0.5rem 1.1rem",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={15} />
            New Task
          </motion.button>
        </div>

        {/* Stats bar */}
        <div style={{
          display: "flex", gap: "1.5rem", flexWrap: "wrap",
          padding: "0.75rem 1rem",
          background: "rgba(0,10,30,0.5)",
          border: "1px solid rgba(0,200,255,0.08)",
          borderRadius: 8,
        }}>
          <StatPill label="Today" value={totalToday} />
          <StatPill label="Done today" value={doneToday} color="#4ade80" />
          <StatPill label="Pending" value={totalPending} color="#f59e0b" />
          <StatPill label="Missed" value={totalMissed} color="#f87171" />
          <StatPill label="Total" value={tasks.length} />
        </div>
      </motion.div>

      {/* Add Task form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: "rgba(0,10,30,0.75)",
              border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: 10, padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ color: "#e2f0ff", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.85rem" }}>
              New Task
            </div>

            {/* Title */}
            <input
              autoFocus
              type="text"
              placeholder="Task title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") createTask.mutate() }}
              style={inputStyle}
            />

            {/* Description */}
            <textarea
              placeholder="Description (optional)..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{
                ...inputStyle,
                height: "auto", resize: "vertical",
                marginTop: "0.5rem", padding: "0.6rem 0.9rem",
                fontFamily: "inherit",
              }}
            />

            {/* Priority + Date row */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              {/* Priority picker */}
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                    style={{
                      padding: "0.3rem 0.7rem",
                      borderRadius: 20,
                      border: `1px solid ${form.priority === p.key ? p.border : "rgba(255,255,255,0.08)"}`,
                      background: form.priority === p.key ? p.bg : "rgba(255,255,255,0.02)",
                      color: form.priority === p.key ? p.color : "rgba(255,255,255,0.25)",
                      fontSize: "0.72rem", fontWeight: form.priority === p.key ? 600 : 400,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Date + Time picker */}
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                style={{
                  ...inputStyle, height: 36, fontSize: "0.8rem",
                  flex: "0 0 auto", width: "auto", marginTop: 0,
                  colorScheme: "dark",
                }}
              />
            </div>

            {formError && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.5rem 0 0" }}>▸ {formError}</p>}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
              <button
                onClick={() => createTask.mutate()}
                disabled={createTask.isPending || !form.title.trim()}
                style={{
                  background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
                  border: "1px solid rgba(0,200,255,0.3)",
                  color: "#fff", borderRadius: 6,
                  padding: "0 1rem", height: 36,
                  fontSize: "0.82rem", fontWeight: 600,
                  cursor: createTask.isPending || !form.title.trim() ? "not-allowed" : "pointer",
                  opacity: createTask.isPending || !form.title.trim() ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {createTask.isPending ? "Adding..." : "Add Task"}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError("") }}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.35)", borderRadius: 6,
                  padding: "0 0.75rem", height: 36,
                  fontSize: "0.82rem", cursor: "pointer",
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
              padding: "0.3rem 0.8rem",
              borderRadius: 20,
              border: `1px solid ${filter === f.key ? "rgba(0,200,255,0.4)" : "rgba(255,255,255,0.07)"}`,
              background: filter === f.key ? "rgba(0,200,255,0.1)" : "rgba(255,255,255,0.02)",
              color: filter === f.key ? "#00c8ff" : "rgba(255,255,255,0.35)",
              fontSize: "0.76rem", fontWeight: filter === f.key ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}
          >
            <Filter size={10} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <LoadingRows />
      ) : filteredTasks.length === 0 ? (
        <EmptyState filter={filter} onAdd={() => setShowForm(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <AnimatePresence>
            {filteredTasks.map((task, i) => {
              const priority = getPriority(task.priority)
              const statusMeta = STATUS_META[task.status]
              const StatusIcon = statusMeta.icon
              const isExpanded = expandedId === task.id
              const isCompleted = task.status === "COMPLETED"
              const isRescheduling = reschedulingId === task.id
              const isChangingPriority = changingPriorityId === task.id

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: isCompleted ? "rgba(74,222,128,0.04)" : "rgba(0,10,30,0.6)",
                    border: `1px solid ${isCompleted ? "rgba(74,222,128,0.15)" : priority.border}`,
                    borderRadius: 10, overflow: "hidden",
                    // Left accent stripe per priority
                    borderLeft: `3px solid ${priority.color}`,
                  }}
                >
                  {/* Main row */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.85rem 1rem",
                  }}>
                    {/* Complete / Undo button */}
                    <button
                      onClick={() => {
                        if (isCompleted) {
                          // Undo — set back to PENDING
                          updateTask.mutate({ id: task.id, status: "PENDING" })
                        } else {
                          completeTask.mutate(task.id)
                        }
                      }}
                      disabled={completeTask.isPending || updateTask.isPending}
                      title={isCompleted ? "Undo complete" : "Mark complete"}
                      style={{
                        background: "none", border: "none",
                        cursor: "pointer",
                        color: isCompleted ? "#4ade80" : "rgba(255,255,255,0.2)",
                        padding: "0.1rem", flexShrink: 0,
                        display: "flex", alignItems: "center",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isCompleted ? "#fbbf24" : "#4ade80"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isCompleted ? "#4ade80" : "rgba(255,255,255,0.2)"
                      }}
                    >
                      {(completeTask.isPending && completeTask.variables === task.id) ||
                       (updateTask.isPending && updateTask.variables?.id === task.id)
                        ? <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
                        : <CheckCircle2 size={18} />
                      }
                    </button>

                    {/* Title + meta */}
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                    >
                      <div style={{
                        color: isCompleted ? "rgba(255,255,255,0.3)" : "#e2f0ff",
                        textDecoration: isCompleted ? "line-through" : "none",
                        fontSize: "0.9rem", fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        transition: "color 0.2s",
                      }}>
                        {task.title}
                        {task.carriedOver > 0 && (
                          <span style={{
                            marginLeft: "0.5rem",
                            color: "#a78bfa", fontSize: "0.7rem",
                            background: "rgba(167,139,250,0.1)",
                            border: "1px solid rgba(167,139,250,0.25)",
                            borderRadius: 10, padding: "0.1rem 0.4rem",
                          }}>
                            ↻ {task.carriedOver}x
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", flexWrap: "wrap", alignItems: "center" }}>
                        {/* Weekday chip */}
                        <span style={{
                          color: "#00c8ff", fontSize: "0.65rem", fontWeight: 700,
                          background: "rgba(0,200,255,0.07)",
                          border: "1px solid rgba(0,200,255,0.15)",
                          borderRadius: 4, padding: "0.1rem 0.4rem",
                          letterSpacing: "0.04em", textTransform: "uppercase",
                        }}>
                          {formatWeekday(task.scheduledAt)}
                        </span>
                        {/* Date */}
                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
                          {formatDate(task.scheduledAt)}
                        </span>
                        {/* Time — only if real time set */}
                        {formatTime(task.scheduledAt) !== null && (
                          <span style={{
                            color: "#a78bfa", fontSize: "0.68rem", fontWeight: 500,
                            background: "rgba(167,139,250,0.07)",
                            border: "1px solid rgba(167,139,250,0.15)",
                            borderRadius: 4, padding: "0.1rem 0.4rem",
                            fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em",
                          }}>
                            {formatTime(task.scheduledAt)}
                          </span>
                        )}
                        {/* · separator */}
                        <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "0.65rem" }}>·</span>
                        {/* Status */}
                        <span style={{ color: statusMeta.color, fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          <StatusIcon size={11} />
                          {statusMeta.label}
                        </span>
                        {/* Priority */}
                        <span style={{ color: priority.color, fontSize: "0.72rem" }}>
                          ⬡ {priority.label}
                        </span>
                        {/* Topic */}
                        {task.topic && (
                          <span style={{ color: "#00c8ff", fontSize: "0.72rem" }}>
                            📚 {task.topic.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.2)", padding: "0.2rem",
                        display: "flex", alignItems: "center", flexShrink: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteTask.mutate(task.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.12)", padding: "0.2rem",
                        display: "flex", alignItems: "center", flexShrink: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.12)"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded detail */}
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
                          padding: "0.75rem 1rem 0.9rem",
                        }}>
                          {/* Description */}
                          {task.description && (
                            <p style={{
                              color: "rgba(255,255,255,0.45)", fontSize: "0.82rem",
                              margin: "0 0 0.75rem", lineHeight: 1.6,
                            }}>
                              {task.description}
                            </p>
                          )}

                          {/* Action buttons */}
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>

                            {/* Not started → mark In Progress */}
                            {task.status === "PENDING" && (
                              <ActionBtn
                                label="▶ In Progress"
                                color="#f59e0b"
                                borderColor="rgba(245,158,11,0.35)"
                                bg="rgba(245,158,11,0.08)"
                                loading={updateTask.isPending && updateTask.variables?.id === task.id && updateTask.variables?.status === "IN_PROGRESS"}
                                onClick={() => updateTask.mutate({ id: task.id, status: "IN_PROGRESS" })}
                              />
                            )}

                            {/* Pending or In Progress → Complete */}
                            {!isCompleted && (
                              <ActionBtn
                                label="✓ Complete"
                                color="#4ade80"
                                borderColor="rgba(74,222,128,0.3)"
                                bg="rgba(74,222,128,0.08)"
                                loading={completeTask.isPending && completeTask.variables === task.id}
                                onClick={() => completeTask.mutate(task.id)}
                              />
                            )}

                            {/* Completed → Undo back to Pending */}
                            {isCompleted && (
                              <ActionBtn
                                label="↩ Undo Complete"
                                color="#fbbf24"
                                borderColor="rgba(251,191,36,0.35)"
                                bg="rgba(251,191,36,0.08)"
                                loading={updateTask.isPending && updateTask.variables?.id === task.id}
                                onClick={() => updateTask.mutate({ id: task.id, status: "PENDING" })}
                              />
                            )}

                            {/* Change Priority — always available */}
                            <ActionBtn
                              label="⬡ Priority"
                              color={getPriority(task.priority).color}
                              borderColor={getPriority(task.priority).border}
                              bg={getPriority(task.priority).bg}
                              loading={false}
                              onClick={() => setChangingPriorityId(isChangingPriority ? null : task.id)}
                            />

                            {/* Reschedule (not completed) */}
                            {!isCompleted && (
                              <ActionBtn
                                label="↻ Reschedule"
                                color="#a78bfa"
                                borderColor="rgba(167,139,250,0.3)"
                                bg="rgba(167,139,250,0.08)"
                                loading={false}
                                onClick={() => {
                                  setReschedulingId(isRescheduling ? null : task.id)
                                  setRescheduleDate(todayDateString())
                                }}
                              />
                            )}
                          </div>

                          {/* Priority picker */}
                          <AnimatePresence>
                            {isChangingPriority && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{
                                  marginTop: "0.65rem",
                                  padding: "0.6rem 0.75rem",
                                  background: "rgba(0,10,30,0.5)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: 8,
                                }}>
                                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", marginBottom: "0.5rem" }}>
                                    Change priority
                                  </div>
                                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                    {PRIORITIES.map((p) => {
                                      const isActive = task.priority === p.key
                                      const isUpdating = updateTask.isPending && updateTask.variables?.id === task.id && updateTask.variables?.priority === p.key
                                      return (
                                        <motion.button
                                          key={p.key}
                                          whileHover={!isActive ? { scale: 1.05 } : {}}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            if (!isActive) {
                                              updateTask.mutate({ id: task.id, priority: p.key })
                                              setChangingPriorityId(null)
                                            }
                                          }}
                                          style={{
                                            padding: "0.3rem 0.85rem",
                                            borderRadius: 20,
                                            border: `1px solid ${isActive ? p.border : "rgba(255,255,255,0.08)"}`,
                                            background: isActive ? p.bg : "rgba(255,255,255,0.02)",
                                            color: isActive ? p.color : "rgba(255,255,255,0.3)",
                                            fontSize: "0.75rem",
                                            fontWeight: isActive ? 700 : 400,
                                            cursor: isActive ? "default" : "pointer",
                                            transition: "all 0.15s",
                                            display: "flex", alignItems: "center", gap: "0.3rem",
                                          }}
                                        >
                                          {isUpdating
                                            ? <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />
                                            : null
                                          }
                                          {isActive ? "✓ " : ""}{p.label}
                                        </motion.button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Reschedule date picker */}
                          <AnimatePresence>
                            {isRescheduling && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: "0.65rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
                              >
                                <input
                                  type="date"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  style={{
                                    ...inputStyle, height: 34, fontSize: "0.8rem",
                                    flex: "0 0 auto", width: "auto", colorScheme: "dark",
                                  }}
                                />
                                <button
                                  onClick={() => rescheduleTask.mutate({ id: task.id, date: rescheduleDate })}
                                  disabled={rescheduleTask.isPending}
                                  style={{
                                    background: "rgba(167,139,250,0.12)",
                                    border: "1px solid rgba(167,139,250,0.3)",
                                    color: "#a78bfa", borderRadius: 6,
                                    padding: "0 0.8rem", height: 34,
                                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                                  }}
                                >
                                  {rescheduleTask.isPending ? "..." : "Confirm"}
                                </button>
                                <button
                                  onClick={() => setReschedulingId(null)}
                                  style={{
                                    background: "none", border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.3)", borderRadius: 6,
                                    padding: "0 0.6rem", height: 34, fontSize: "0.8rem", cursor: "pointer",
                                  }}
                                >
                                  ✕
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
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

function ActionBtn({
  label, color, borderColor, bg, loading, onClick,
}: {
  label: string; color: string; borderColor: string; bg: string
  loading: boolean; onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={loading}
      style={{
        background: bg, border: `1px solid ${borderColor}`,
        color, borderRadius: 6,
        padding: "0.3rem 0.85rem",
        fontSize: "0.78rem", fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: "0.3rem",
        transition: "opacity 0.2s",
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
        <div
          key={i}
          style={{
            height: 62, borderRadius: 10,
            background: "rgba(0,10,30,0.6)",
            border: "1px solid rgba(0,200,255,0.06)",
            borderLeft: "3px solid rgba(0,200,255,0.1)",
            display: "flex", alignItems: "center", padding: "0 1rem", gap: "0.75rem",
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: `rgba(0,200,255,${o * 0.07})` }} />
          <div style={{ flex: 1, height: 13, borderRadius: 6, background: `rgba(0,200,255,${o * 0.06})`, maxWidth: `${240 - i * 40}px` }} />
          <div style={{ width: 55, height: 20, borderRadius: 10, background: `rgba(0,200,255,${o * 0.05})` }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ filter, onAdd }: { filter: string; onAdd: () => void }) {
  const msg =
    filter === "today"   ? "No tasks scheduled for today." :
    filter === "pending" ? "No pending tasks — you're all caught up!" :
    filter === "done"    ? "No completed tasks yet." :
    filter === "missed"  ? "No missed tasks. Nice work! 🎯" :
    "No tasks yet. Create your first one!"

  return (
    <div style={{
      textAlign: "center", padding: "3rem 1rem",
      border: "1px dashed rgba(0,200,255,0.15)", borderRadius: 10,
    }}>
      <CheckCircle2 size={32} color="rgba(0,200,255,0.2)" style={{ margin: "0 auto 0.75rem" }} />
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", margin: "0 0 1rem" }}>{msg}</p>
      {filter === "all" && (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onAdd}
          style={{
            background: "rgba(0,200,255,0.08)",
            border: "1px solid rgba(0,200,255,0.25)",
            color: "#00c8ff", borderRadius: 8,
            padding: "0.5rem 1.2rem", fontSize: "0.82rem",
            fontWeight: 600, cursor: "pointer",
          }}
        >
          + New Task
        </motion.button>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(0,20,50,0.6)",
  border: "1px solid rgba(0,200,255,0.2)",
  borderRadius: 6, height: 42, padding: "0 0.9rem",
  color: "#e2f0ff", fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box",
}
