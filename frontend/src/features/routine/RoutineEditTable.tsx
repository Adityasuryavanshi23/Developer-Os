import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, Plus, Check, X, Pencil, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { routineService } from "./routine.service"
import type { RoutineActivity, CreateActivityInput, RoutineCategory, ActivityType, Day } from "./routine.service"
import TimePickerInput from "./TimePickerInput"

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS: Day[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const DAY_LABELS: Record<Day, string> = { MON: "M", TUE: "T", WED: "W", THU: "T", FRI: "F", SAT: "S", SUN: "S" }
const DAY_FULL:   Record<Day, string> = { MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" }

const CATEGORIES: RoutineCategory[] = ["LEARNING","WORK","COLLEGE","FITNESS","HEALTH","PERSONAL","FAMILY","TRAVEL","REST","CUSTOM"]
const CAT_COLOR: Record<RoutineCategory, string> = {
  LEARNING: "#00c8ff", WORK: "#a78bfa", COLLEGE: "#34d399",
  FITNESS:  "#f59e0b", HEALTH: "#10b981", PERSONAL: "#e2f0ff",
  FAMILY:   "#f472b6", TRAVEL: "#fb923c", REST:     "#94a3b8", CUSTOM: "#64748b",
}
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#64748b", MEDIUM: "#a0c4e0", HIGH: "#f59e0b", CRITICAL: "#f87171",
}

// ── Column definitions ────────────────────────────────────────────────────────

type ColKey = "time" | "activity" | "category" | "type" | "priority" | "days" | "actions"

const ALL_COLS: { key: ColKey; label: string; required?: boolean }[] = [
  { key: "time",     label: "Time",     required: true  },
  { key: "activity", label: "Activity", required: true  },
  { key: "category", label: "Category"                  },
  { key: "type",     label: "Type"                      },
  { key: "priority", label: "Priority"                  },
  { key: "days",     label: "Days"                      },
  { key: "actions",  label: "Actions",  required: true  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`
}

function blankActivity(): CreateActivityInput {
  return { name: "", category: "PERSONAL", startTime: "09:00", endTime: "10:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "MEDIUM" }
}

// ── Shared input style ────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(0,200,255,0.2)",
  borderRadius: 6,
  padding: "0.3rem 0.5rem",
  color: "#e2f0ff",
  fontSize: "0.78rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RoutineEditTable({ onBack }: Props) {
  const qc = useQueryClient()

  // visible columns state — all on by default
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    time: true, activity: true, category: true,
    type: true, priority: true, days: true, actions: true,
  })
  const [colPickerOpen, setColPickerOpen] = useState(false)

  // which row is being edited (by activity id, or "new" for add row)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editDraft, setEditDraft]   = useState<Partial<CreateActivityInput>>({})
  const [addingNew, setAddingNew]   = useState(false)
  const [newDraft, setNewDraft]     = useState<CreateActivityInput>(blankActivity())

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: routine, isLoading } = useQuery({
    queryKey: ["routine"],
    queryFn: routineService.getRoutine,
  })

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateActivityInput> }) =>
      routineService.updateActivity(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routine"] })
      qc.invalidateQueries({ queryKey: ["routine", "today"] })
      toast.success("Activity updated")
      setEditingId(null)
      setEditDraft({})
    },
    onError: () => toast.error("Update failed"),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => routineService.deleteActivity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routine"] })
      qc.invalidateQueries({ queryKey: ["routine", "today"] })
      toast.success("Activity removed")
    },
    onError: () => toast.error("Delete failed"),
  })

  const addMut = useMutation({
    mutationFn: (data: CreateActivityInput) => routineService.addActivity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routine"] })
      qc.invalidateQueries({ queryKey: ["routine", "today"] })
      toast.success("Activity added")
      setAddingNew(false)
      setNewDraft(blankActivity())
    },
    onError: () => toast.error("Add failed"),
  })

  // ── Handlers ─────────────────────────────────────────────────────────────
  function startEdit(act: RoutineActivity) {
    setEditingId(act.id)
    setEditDraft({
      name: act.name, category: act.category,
      startTime: act.startTime, endTime: act.endTime,
      repeatDays: act.repeatDays, type: act.type, priority: act.priority,
      goalNote: act.goalNote,
    })
    setAddingNew(false)
  }

  function saveEdit(id: string) {
    if (!editDraft.name?.trim()) { toast.error("Name is required"); return }
    updateMut.mutate({ id, data: editDraft })
  }

  function saveNew() {
    if (!newDraft.name.trim()) { toast.error("Name is required"); return }
    addMut.mutate(newDraft)
  }

  function toggleDay(draft: CreateActivityInput, day: Day, setDraft: (d: CreateActivityInput) => void) {
    const days = draft.repeatDays.includes(day)
      ? draft.repeatDays.filter((d) => d !== day)
      : [...draft.repeatDays, day]
    setDraft({ ...draft, repeatDays: days })
  }

  function toggleEditDay(day: Day) {
    const cur = (editDraft.repeatDays ?? []) as Day[]
    setEditDraft({
      ...editDraft,
      repeatDays: cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day],
    })
  }

  function toggleCol(key: ColKey) {
    if (ALL_COLS.find((c) => c.key === key)?.required) return
    setVisibleCols((p) => ({ ...p, [key]: !p[key] }))
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ color: "#a0c4e0", fontSize: "0.85rem", fontFamily: "monospace" }}>Loading…</div>
    </div>
  )

  const activities = routine?.activities ?? []
  const vis = visibleCols

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1.5rem" }}>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.4rem 0.75rem", color: "#a0c4e0", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e2f0ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a0c4e0")}
          >
            <ArrowLeft size={13} /> Back
          </button>
          <div>
            <div style={{ color: "#e2f0ff", fontSize: "0.95rem", fontWeight: 700 }}>Edit Activities</div>
            <div style={{ color: "#a0c4e0", fontSize: "0.68rem" }}>{activities.length} activit{activities.length !== 1 ? "ies" : "y"}</div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>

          {/* Column picker toggle */}
          <button
            onClick={() => setColPickerOpen((p) => !p)}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.4rem 0.75rem", color: "#a0c4e0", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            {colPickerOpen ? <EyeOff size={13} /> : <Eye size={13} />} Columns
          </button>

          {/* Column picker dropdown */}
          {colPickerOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50,
              background: "rgba(0,8,24,0.98)", border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: 10, padding: "0.75rem", minWidth: 160,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}>
              <div style={{ color: "#a0c4e0", fontSize: "0.65rem", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>VISIBLE COLUMNS</div>
              {ALL_COLS.map((col) => (
                <div
                  key={col.key}
                  onClick={() => toggleCol(col.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.3rem 0.25rem", cursor: col.required ? "default" : "pointer",
                    borderRadius: 5,
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: vis[col.key] ? "rgba(0,200,255,0.2)" : "rgba(255,255,255,0.05)",
                    border: vis[col.key] ? "1px solid rgba(0,200,255,0.5)" : "1px solid rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {vis[col.key] && <Check size={10} color="#00c8ff" />}
                  </div>
                  <span style={{ color: col.required ? "#64748b" : "#b8d4e8", fontSize: "0.78rem" }}>
                    {col.label} {col.required && <span style={{ fontSize: "0.6rem" }}>(required)</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add activity */}
          <button
            onClick={() => { setAddingNew(true); setEditingId(null) }}
            style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.3)", borderRadius: 8, padding: "0.4rem 0.85rem", color: "#00c8ff", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Plus size={13} /> Add Activity
          </button>
        </div>
      </div>

      {/* ── Table wrapper ── */}
      <div style={{ background: "rgba(0,6,18,0.8)", border: "1px solid rgba(0,200,255,0.12)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,rgba(0,200,255,0.5),transparent)" }} />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>

            {/* ── THead ── */}
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,200,255,0.1)", background: "rgba(0,200,255,0.03)" }}>
                {vis.time     && <Th>Time</Th>}
                {vis.activity && <Th>Activity</Th>}
                {vis.category && <Th>Category</Th>}
                {vis.type     && <Th>Type</Th>}
                {vis.priority && <Th>Priority</Th>}
                {vis.days     && <Th>Repeat Days</Th>}
                {vis.actions  && <Th center>Actions</Th>}
              </tr>
            </thead>

            {/* ── TBody ── */}
            <tbody>

              {/* Existing activities */}
              {activities.map((act, idx) => {
                const isEditing  = editingId === act.id
                const isLast     = idx === activities.length - 1 && !addingNew
                const catColor   = CAT_COLOR[act.category]
                const rowBorder  = isLast ? "none" : "1px solid rgba(255,255,255,0.04)"

                return isEditing ? (
                  // ── Edit row ──
                  <tr key={act.id} style={{ borderBottom: rowBorder, background: "rgba(0,200,255,0.04)" }}>
                    {vis.time && (
                        <Td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: 120 }}>
                            <TimePickerInput value={editDraft.startTime ?? act.startTime} onChange={(v) => setEditDraft({ ...editDraft, startTime: v })} />
                            <TimePickerInput value={editDraft.endTime ?? act.endTime}     onChange={(v) => setEditDraft({ ...editDraft, endTime: v })} />
                          </div>
                        </Td>
                      )}
                    {vis.activity && (
                      <Td>
                        <input value={editDraft.name ?? ""}
                          onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                          placeholder="Activity name" style={{ ...inp, minWidth: 140 }} />
                      </Td>
                    )}
                    {vis.category && (
                      <Td>
                        <select value={editDraft.category ?? act.category}
                          onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as RoutineCategory })}
                          style={{ ...inp, minWidth: 100 }}>
                          {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: "#020c1b" }}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                        </select>
                      </Td>
                    )}
                    {vis.type && (
                      <Td>
                        <select value={editDraft.type ?? act.type}
                          onChange={(e) => setEditDraft({ ...editDraft, type: e.target.value as ActivityType })}
                          style={{ ...inp, minWidth: 90 }}>
                          <option value="FLEXIBLE" style={{ background: "#020c1b" }}>Flexible</option>
                          <option value="FIXED"    style={{ background: "#020c1b" }}>Fixed</option>
                        </select>
                      </Td>
                    )}
                    {vis.priority && (
                      <Td>
                        <select value={editDraft.priority ?? act.priority}
                          onChange={(e) => setEditDraft({ ...editDraft, priority: e.target.value as CreateActivityInput["priority"] })}
                          style={{ ...inp, minWidth: 90 }}>
                          {["LOW","MEDIUM","HIGH","CRITICAL"].map((p) => <option key={p} value={p} style={{ background: "#020c1b" }}>{p.charAt(0)+p.slice(1).toLowerCase()}</option>)}
                        </select>
                      </Td>
                    )}
                    {vis.days && (
                      <Td>
                        <DayPicker days={(editDraft.repeatDays ?? act.repeatDays) as Day[]} onToggle={toggleEditDay} />
                      </Td>
                    )}
                    {vis.actions && (
                      <Td center>
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem" }}>
                          <IconBtn color="#34d399" title="Save" onClick={() => saveEdit(act.id)} loading={updateMut.isPending}>
                            <Check size={13} />
                          </IconBtn>
                          <IconBtn color="#f87171" title="Cancel" onClick={() => { setEditingId(null); setEditDraft({}) }}>
                            <X size={13} />
                          </IconBtn>
                        </div>
                      </Td>
                    )}
                  </tr>
                ) : (
                  // ── View row ──
                  <tr key={act.id}
                    style={{ borderBottom: rowBorder, transition: "background 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                  >
                    {vis.time && (
                      <Td>
                        <div style={{ color: catColor, fontSize: "0.78rem", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {fmtTime(act.startTime)} → {fmtTime(act.endTime)}
                        </div>
                      </Td>
                    )}
                    {vis.activity && (
                      <Td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                          <div style={{ width: 3, height: 18, borderRadius: 99, background: catColor, flexShrink: 0 }} />
                          <span style={{ color: "#e2f0ff", fontWeight: 600, fontSize: "0.85rem" }}>{act.name}</span>
                        </div>
                      </Td>
                    )}
                    {vis.category && (
                      <Td>
                        <span style={{ background: `${catColor}15`, border: `1px solid ${catColor}30`, borderRadius: 20, padding: "0.15rem 0.6rem", color: catColor, fontSize: "0.68rem", fontWeight: 600 }}>
                          {act.category.charAt(0) + act.category.slice(1).toLowerCase()}
                        </span>
                      </Td>
                    )}
                    {vis.type && (
                      <Td>
                        <span style={{ color: act.type === "FIXED" ? "#f59e0b" : "#a0c4e0", fontSize: "0.75rem" }}>
                          {act.type === "FIXED" ? "Fixed" : "Flexible"}
                        </span>
                      </Td>
                    )}
                    {vis.priority && (
                      <Td>
                        <span style={{ color: PRIORITY_COLOR[act.priority], fontSize: "0.72rem", fontWeight: 600, fontFamily: "monospace" }}>
                          {act.priority.charAt(0) + act.priority.slice(1).toLowerCase()}
                        </span>
                      </Td>
                    )}
                    {vis.days && (
                      <Td>
                        <div style={{ display: "flex", gap: "0.2rem" }}>
                          {DAYS.map((d) => {
                            const active = (act.repeatDays as Day[]).includes(d)
                            return (
                              <div key={d} title={DAY_FULL[d]} style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: active ? `${catColor}20` : "rgba(255,255,255,0.04)",
                                border: active ? `1px solid ${catColor}50` : "1px solid rgba(255,255,255,0.08)",
                                color: active ? catColor : "#64748b",
                                fontSize: "0.6rem", fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {DAY_LABELS[d]}
                              </div>
                            )
                          })}
                        </div>
                      </Td>
                    )}
                    {vis.actions && (
                      <Td center>
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem" }}>
                          <IconBtn color="#00c8ff" title="Edit" onClick={() => startEdit(act)}>
                            <Pencil size={12} />
                          </IconBtn>
                          <IconBtn color="#f87171" title="Delete" onClick={() => deleteMut.mutate(act.id)} loading={deleteMut.isPending}>
                            <Trash2 size={12} />
                          </IconBtn>
                        </div>
                      </Td>
                    )}
                  </tr>
                )
              })}

              {/* ── Add new row ── */}
              {addingNew && (
                <tr style={{ borderTop: "1px solid rgba(0,200,255,0.1)", background: "rgba(0,200,255,0.03)" }}>
                  {vis.time && (
                    <Td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: 120 }}>
                        <TimePickerInput value={newDraft.startTime} onChange={(v) => setNewDraft({ ...newDraft, startTime: v })} />
                        <TimePickerInput value={newDraft.endTime}   onChange={(v) => setNewDraft({ ...newDraft, endTime: v })} />
                      </div>
                    </Td>
                  )}
                  {vis.activity && (
                    <Td>
                      <input value={newDraft.name} autoFocus
                        onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })}
                        placeholder="Activity name" style={{ ...inp, minWidth: 140 }} />
                    </Td>
                  )}
                  {vis.category && (
                    <Td>
                      <select value={newDraft.category}
                        onChange={(e) => setNewDraft({ ...newDraft, category: e.target.value as RoutineCategory })}
                        style={{ ...inp, minWidth: 100 }}>
                        {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: "#020c1b" }}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                      </select>
                    </Td>
                  )}
                  {vis.type && (
                    <Td>
                      <select value={newDraft.type}
                        onChange={(e) => setNewDraft({ ...newDraft, type: e.target.value as ActivityType })}
                        style={{ ...inp, minWidth: 90 }}>
                        <option value="FLEXIBLE" style={{ background: "#020c1b" }}>Flexible</option>
                        <option value="FIXED"    style={{ background: "#020c1b" }}>Fixed</option>
                      </select>
                    </Td>
                  )}
                  {vis.priority && (
                    <Td>
                      <select value={newDraft.priority}
                        onChange={(e) => setNewDraft({ ...newDraft, priority: e.target.value as CreateActivityInput["priority"] })}
                        style={{ ...inp, minWidth: 90 }}>
                        {["LOW","MEDIUM","HIGH","CRITICAL"].map((p) => <option key={p} value={p} style={{ background: "#020c1b" }}>{p.charAt(0)+p.slice(1).toLowerCase()}</option>)}
                      </select>
                    </Td>
                  )}
                  {vis.days && (
                    <Td>
                      <DayPicker days={newDraft.repeatDays} onToggle={(d) => toggleDay(newDraft, d, setNewDraft)} />
                    </Td>
                  )}
                  {vis.actions && (
                    <Td center>
                      <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem" }}>
                        <IconBtn color="#34d399" title="Save" onClick={saveNew} loading={addMut.isPending}>
                          <Check size={13} />
                        </IconBtn>
                        <IconBtn color="#f87171" title="Cancel" onClick={() => { setAddingNew(false); setNewDraft(blankActivity()) }}>
                          <X size={13} />
                        </IconBtn>
                      </div>
                    </Td>
                  )}
                </tr>
              )}

              {/* Empty state */}
              {activities.length === 0 && !addingNew && (
                <tr>
                  <td colSpan={ALL_COLS.filter((c) => vis[c.key]).length}
                    style={{ textAlign: "center", padding: "2.5rem", color: "#a0c4e0", fontSize: "0.82rem" }}>
                    No activities yet. Click <strong style={{ color: "#00c8ff" }}>Add Activity</strong> to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "0.6rem 1rem", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#a0c4e0", fontSize: "0.68rem" }}>
            {activities.length} activit{activities.length !== 1 ? "ies" : "y"} in routine
          </span>
          <span style={{ color: "#64748b", fontSize: "0.65rem" }}>
            Click <Pencil size={10} style={{ display: "inline", verticalAlign: "middle" }} /> to edit a row
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th style={{
      padding: "0.7rem 1rem", color: "#a0c4e0", fontSize: "0.63rem",
      fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
      textAlign: center ? "center" : "left", whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  )
}

function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", textAlign: center ? "center" : "left" }}>
      {children}
    </td>
  )
}

function IconBtn({ children, color, title, onClick, loading }: {
  children: React.ReactNode; color: string; title: string
  onClick: () => void; loading?: boolean
}) {
  return (
    <button onClick={onClick} disabled={loading} title={title}
      style={{
        background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 7,
        width: 28, height: 28, cursor: loading ? "default" : "pointer",
        color: loading ? `${color}50` : color,
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = `${color}25` }}
      onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = `${color}12` }}
    >
      {loading ? <span style={{ fontSize: 9 }}>…</span> : children}
    </button>
  )
}

function DayPicker({ days, onToggle }: { days: Day[]; onToggle: (d: Day) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.2rem" }}>
      {DAYS.map((d) => {
        const on = days.includes(d)
        return (
          <button key={d} onClick={() => onToggle(d)} title={DAY_FULL[d]}
            style={{
              width: 22, height: 22, borderRadius: "50%",
              background: on ? "rgba(0,200,255,0.2)" : "rgba(255,255,255,0.04)",
              border: on ? "1px solid rgba(0,200,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: on ? "#00c8ff" : "#64748b",
              fontSize: "0.6rem", fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {DAY_LABELS[d]}
          </button>
        )
      })}
    </div>
  )
}
