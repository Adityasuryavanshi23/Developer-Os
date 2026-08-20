import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, Plus, Trash2, Check, Zap } from "lucide-react"
import { toast } from "sonner"
import { routineService } from "./routine.service"
import type { CreateActivityInput, Day, RoutineCategory, ActivityType } from "./routine.service"
import TimePickerInput from "./TimePickerInput"

// ── Static suggestion data ────────────────────────────────────────────────────

const USER_TYPES = ["Student", "Working Professional", "Job Seeker", "Career Switcher", "Other"]

const GOALS = [
  "Software Development", "Interview Preparation", "DSA / Algorithms",
  "Fitness", "Academic Performance", "Career Growth", "Personal Productivity",
]

const SUGGESTED: Record<string, CreateActivityInput[]> = {
  Student: [
    { name: "Morning Study", category: "LEARNING", startTime: "07:00", endTime: "08:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "HIGH" },
    { name: "College",       category: "COLLEGE",  startTime: "09:00", endTime: "17:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FIXED",    priority: "HIGH" },
    { name: "DSA Practice",  category: "LEARNING", startTime: "20:00", endTime: "21:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "HIGH" },
    { name: "Revision",      category: "LEARNING", startTime: "21:00", endTime: "21:30", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "MEDIUM" },
    { name: "Exercise",      category: "FITNESS",  startTime: "17:30", endTime: "18:30", repeatDays: ["MON","WED","FRI"],             type: "FLEXIBLE", priority: "MEDIUM" },
  ],
  "Working Professional": [
    { name: "Morning Exercise", category: "FITNESS",  startTime: "06:30", endTime: "07:30", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "MEDIUM" },
    { name: "Office",           category: "WORK",     startTime: "09:00", endTime: "18:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FIXED",    priority: "HIGH" },
    { name: "Technical Learning",category:"LEARNING", startTime: "20:00", endTime: "21:00", repeatDays: ["MON","TUE","WED","THU"],       type: "FLEXIBLE", priority: "HIGH" },
    { name: "DSA",              category: "LEARNING", startTime: "21:00", endTime: "21:45", repeatDays: ["MON","TUE","WED","THU"],       type: "FLEXIBLE", priority: "HIGH" },
    { name: "Reading",          category: "PERSONAL", startTime: "22:00", endTime: "22:30", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "LOW" },
  ],
  "Job Seeker": [
    { name: "DSA Practice",      category: "LEARNING", startTime: "08:00", endTime: "10:00", repeatDays: ["MON","TUE","WED","THU","FRI","SAT"], type: "FLEXIBLE", priority: "CRITICAL" },
    { name: "Interview Prep",    category: "LEARNING", startTime: "10:30", endTime: "12:30", repeatDays: ["MON","TUE","WED","THU","FRI","SAT"], type: "FLEXIBLE", priority: "CRITICAL" },
    { name: "Project Work",      category: "WORK",     startTime: "14:00", endTime: "17:00", repeatDays: ["MON","TUE","WED","THU","FRI"],       type: "FLEXIBLE", priority: "HIGH" },
    { name: "Revision",          category: "LEARNING", startTime: "20:00", endTime: "21:00", repeatDays: ["MON","TUE","WED","THU","FRI"],       type: "FLEXIBLE", priority: "MEDIUM" },
    { name: "Exercise",          category: "FITNESS",  startTime: "06:30", endTime: "07:15", repeatDays: ["MON","WED","FRI","SAT"],              type: "FLEXIBLE", priority: "MEDIUM" },
  ],
  "Career Switcher": [
    { name: "Core Skill Study",  category: "LEARNING", startTime: "06:30", endTime: "08:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "CRITICAL" },
    { name: "Office / Work",     category: "WORK",     startTime: "09:00", endTime: "18:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FIXED",    priority: "HIGH" },
    { name: "Project Development",category:"WORK",     startTime: "19:30", endTime: "21:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "HIGH" },
    { name: "Revision",          category: "LEARNING", startTime: "21:00", endTime: "21:30", repeatDays: ["MON","TUE","WED","THU"],       type: "FLEXIBLE", priority: "MEDIUM" },
  ],
  Other: [
    { name: "Morning Routine",   category: "PERSONAL", startTime: "07:00", endTime: "08:00", repeatDays: ["MON","TUE","WED","THU","FRI","SAT","SUN"], type: "FIXED",    priority: "MEDIUM" },
    { name: "Deep Work",         category: "WORK",     startTime: "09:00", endTime: "12:00", repeatDays: ["MON","TUE","WED","THU","FRI"],              type: "FLEXIBLE", priority: "HIGH" },
    { name: "Exercise",          category: "FITNESS",  startTime: "17:00", endTime: "18:00", repeatDays: ["MON","WED","FRI"],                          type: "FLEXIBLE", priority: "MEDIUM" },
    { name: "Learning",          category: "LEARNING", startTime: "20:00", endTime: "21:30", repeatDays: ["MON","TUE","WED","THU","FRI"],              type: "FLEXIBLE", priority: "HIGH" },
  ],
}

const DAYS: Day[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const DAY_LABELS: Record<Day, string> = { MON: "M", TUE: "T", WED: "W", THU: "T", FRI: "F", SAT: "S", SUN: "S" }
const DAY_FULL: Record<Day, string>   = { MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" }

const CATEGORIES: RoutineCategory[] = ["LEARNING","WORK","COLLEGE","FITNESS","HEALTH","PERSONAL","FAMILY","TRAVEL","REST","CUSTOM"]
// ── Blank new activity template ───────────────────────────────────────────────
function blankActivity(): CreateActivityInput {
  return { name: "", category: "PERSONAL", startTime: "09:00", endTime: "10:00", repeatDays: ["MON","TUE","WED","THU","FRI"], type: "FLEXIBLE", priority: "MEDIUM" }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  onComplete: () => void
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(0,8,24,0.97)",
  border: "1px solid rgba(0,200,255,0.18)",
  borderRadius: 14,
  boxShadow: "0 0 0 1px rgba(0,200,255,0.06), 0 24px 80px rgba(0,0,0,0.8)",
  width: "100%",
  maxWidth: 560,
  margin: "0 auto",
  overflow: "hidden",
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(0,200,255,0.2)",
  borderRadius: 8,
  padding: "0.55rem 0.8rem",
  color: "#e2f0ff",
  fontSize: "0.85rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function RoutineWizard({ onComplete }: Props) {
  const [step, setStep]           = useState(0)
  const [userType, setUserType]   = useState("")
  const [goals, setGoals]         = useState<string[]>([])
  const [fixedActs, setFixedActs] = useState<CreateActivityInput[]>([
    { name: "Sleep", category: "REST", startTime: "23:00", endTime: "06:30", repeatDays: [...DAYS], type: "FIXED", priority: "HIGH" },
  ])
  const [flexActs, setFlexActs]   = useState<CreateActivityInput[]>([])
  const [customActs, setCustomActs] = useState<CreateActivityInput[]>([])
  const [saving, setSaving]       = useState(false)

  // When user type is picked in step 1 → pre-load suggestions into step 4
  function pickUserType(type: string) {
    setUserType(type)
    setFlexActs(SUGGESTED[type] ?? SUGGESTED["Other"])
  }

  function toggleGoal(g: string) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  // ── Fixed activities (step 3) ────────────────────────────────────────────
  function addFixed() { setFixedActs((p) => [...p, { ...blankActivity(), type: "FIXED" }]) }
  function updateFixed(i: number, field: keyof CreateActivityInput, val: unknown) {
    setFixedActs((p) => p.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  }
  function removeFixed(i: number) { setFixedActs((p) => p.filter((_, idx) => idx !== i)) }

  // ── Flexible activities (step 4) ─────────────────────────────────────────
  function addFlex() { setFlexActs((p) => [...p, blankActivity()]) }
  function updateFlex(i: number, field: keyof CreateActivityInput, val: unknown) {
    setFlexActs((p) => p.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  }
  function removeFlex(i: number) { setFlexActs((p) => p.filter((_, idx) => idx !== i)) }

  // ── Custom activities (step 5) ────────────────────────────────────────────
  function addCustom() { setCustomActs((p) => [...p, blankActivity()]) }
  function updateCustom(i: number, field: keyof CreateActivityInput, val: unknown) {
    setCustomActs((p) => p.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  }
  function removeCustom(i: number) { setCustomActs((p) => p.filter((_, idx) => idx !== i)) }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    const all = [...fixedActs, ...flexActs, ...customActs].filter((a) => a.name.trim() !== "")
    if (all.length === 0) { toast.error("Add at least one activity"); return }

    setSaving(true)
    try {
      await routineService.setup({ activities: all })
      toast.success("Routine created!", { description: "Your daily routine is ready." })
      onComplete()
    } catch {
      toast.error("Failed to save routine. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const STEPS = ["Profile", "Goals", "Fixed", "Flexible", "Custom"]
  const canNext = [
    userType !== "",              // step 0
    goals.length > 0,            // step 1
    fixedActs.length > 0,        // step 2
    flexActs.length > 0,         // step 3
    true,                        // step 4 (custom is optional)
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#020c1b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>

      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.7), transparent)" }} />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ color: "#00c8ff", fontSize: "0.75rem", fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: "0.4rem" }}>ROUTINE SETUP</div>
        <div style={{ color: "#e2f0ff", fontSize: "1.5rem", fontWeight: 700 }}>Build Your Ideal Day</div>
        <div style={{ color: "#a0c4e0", fontSize: "0.82rem", marginTop: "0.3rem" }}>A quick setup to create your personalized daily routine</div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {STEPS.map((_label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 700,
              background: i < step ? "rgba(0,200,255,0.15)" : i === step ? "rgba(0,200,255,0.2)" : "rgba(255,255,255,0.05)",
              border: i <= step ? "1px solid rgba(0,200,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: i <= step ? "#00c8ff" : "#a0c4e0",
            }}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 20, height: 1, background: i < step ? "rgba(0,200,255,0.4)" : "rgba(255,255,255,0.1)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={card}>
        {/* Card top accent */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.6), transparent)" }} />

        <div style={{ padding: "1.5rem" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >

              {/* ── Step 0: User Type ── */}
              {step === 0 && (
                <StepShell title="What describes you best?" sub="We'll suggest a routine that fits your lifestyle.">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {USER_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => pickUserType(t)}
                        style={{
                          background: userType === t ? "rgba(0,200,255,0.12)" : "rgba(255,255,255,0.03)",
                          border: userType === t ? "1px solid rgba(0,200,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8, padding: "0.7rem 1rem",
                          color: userType === t ? "#00c8ff" : "#b8d4e8",
                          fontSize: "0.88rem", fontWeight: userType === t ? 600 : 400,
                          cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}
                      >
                        {t}
                        {userType === t && <Check size={14} color="#00c8ff" />}
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {/* ── Step 1: Goals ── */}
              {step === 1 && (
                <StepShell title="What are your primary goals?" sub="Select all that apply — helps us customize your routine.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {GOALS.map((g) => (
                      <button
                        key={g}
                        onClick={() => toggleGoal(g)}
                        style={{
                          background: goals.includes(g) ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                          border: goals.includes(g) ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 20, padding: "0.4rem 0.9rem",
                          color: goals.includes(g) ? "#a78bfa" : "#b8d4e8",
                          fontSize: "0.82rem", fontWeight: goals.includes(g) ? 600 : 400,
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {/* ── Step 2: Fixed Activities ── */}
              {step === 2 && (
                <StepShell title="Fixed schedule — what can't be moved?" sub="College, office, sleep, meals — things at fixed times.">
                  <ActivityList
                    activities={fixedActs}
                    onUpdate={updateFixed}
                    onRemove={removeFixed}
                    onAdd={addFixed}
                    addLabel="Add fixed activity"
                  />
                </StepShell>
              )}

              {/* ── Step 3: Flexible Activities ── */}
              {step === 3 && (
                <StepShell title="Flexible activities" sub={`Suggested for ${userType || "you"} — edit, remove, or add more.`}>
                  <ActivityList
                    activities={flexActs}
                    onUpdate={updateFlex}
                    onRemove={removeFlex}
                    onAdd={addFlex}
                    addLabel="Add flexible activity"
                  />
                </StepShell>
              )}

              {/* ── Step 4: Custom Activities ── */}
              {step === 4 && (
                <StepShell title="Any custom activities?" sub="English speaking, meditation, reading — anything else you want to track.">
                  {customActs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                      <div style={{ color: "#a0c4e0", fontSize: "0.82rem", marginBottom: "1rem" }}>
                        Optional — skip if not needed, or add activities below.
                      </div>
                      <button
                        onClick={addCustom}
                        style={{
                          background: "rgba(0,200,255,0.08)", border: "1px dashed rgba(0,200,255,0.3)",
                          borderRadius: 8, padding: "0.6rem 1.2rem",
                          color: "#00c8ff", fontSize: "0.82rem", cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        }}
                      >
                        <Plus size={14} /> Add custom activity
                      </button>
                    </div>
                  ) : (
                    <ActivityList
                      activities={customActs}
                      onUpdate={updateCustom}
                      onRemove={removeCustom}
                      onAdd={addCustom}
                      addLabel="Add another"
                    />
                  )}
                </StepShell>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "1rem 1.5rem",
          borderTop: "1px solid rgba(0,200,255,0.08)",
        }}>
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "0.5rem 1rem",
              color: step === 0 ? "rgba(255,255,255,0.2)" : "#a0c4e0",
              fontSize: "0.82rem", cursor: step === 0 ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: "0.35rem",
            }}
          >
            <ChevronLeft size={14} /> Back
          </button>

          <div style={{ color: "#a0c4e0", fontSize: "0.72rem", fontFamily: "monospace" }}>
            {step + 1} / {STEPS.length}
          </div>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext[step]}
              style={{
                background: canNext[step] ? "rgba(0,200,255,0.15)" : "rgba(255,255,255,0.04)",
                border: canNext[step] ? "1px solid rgba(0,200,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "0.5rem 1rem",
                color: canNext[step] ? "#00c8ff" : "rgba(255,255,255,0.2)",
                fontSize: "0.82rem", fontWeight: 600,
                cursor: canNext[step] ? "pointer" : "default",
                display: "flex", alignItems: "center", gap: "0.35rem",
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? "rgba(0,200,255,0.08)" : "rgba(0,200,255,0.18)",
                border: "1px solid rgba(0,200,255,0.5)",
                borderRadius: 8, padding: "0.5rem 1.2rem",
                color: "#00c8ff", fontSize: "0.85rem", fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              <Zap size={14} /> {saving ? "Saving…" : "Create Routine"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helper: Step wrapper ──────────────────────────────────────────────────────
function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ color: "#e2f0ff", fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>{title}</div>
        <div style={{ color: "#a0c4e0", fontSize: "0.78rem" }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}

// ── Helper: Activity list (reused in steps 2, 3, 4) ──────────────────────────
function ActivityList({
  activities, onUpdate, onRemove, onAdd, addLabel,
}: {
  activities: CreateActivityInput[]
  onUpdate: (i: number, field: keyof CreateActivityInput, val: unknown) => void
  onRemove: (i: number) => void
  onAdd: () => void
  addLabel: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
      {activities.map((act, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "0.85rem",
          }}
        >
          {/* Row 1: Name + delete */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <input
              value={act.name}
              onChange={(e) => onUpdate(i, "name", e.target.value)}
              placeholder="Activity name"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => onRemove(i)}
              style={{ background: "none", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 7, padding: "0 0.5rem", color: "#f87171", cursor: "pointer", flexShrink: 0 }}
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Row 2: Start time + End time + Category */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#a0c4e0", fontSize: "0.65rem", marginBottom: "0.2rem" }}>Start</div>
              <TimePickerInput value={act.startTime} onChange={(v) => onUpdate(i, "startTime", v)} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#a0c4e0", fontSize: "0.65rem", marginBottom: "0.2rem" }}>End</div>
              <TimePickerInput value={act.endTime} onChange={(v) => onUpdate(i, "endTime", v)} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#a0c4e0", fontSize: "0.65rem", marginBottom: "0.2rem" }}>Category</div>
              <select value={act.category} onChange={(e) => onUpdate(i, "category", e.target.value as RoutineCategory)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: "#020c1b" }}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Type + Priority */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#a0c4e0", fontSize: "0.65rem", marginBottom: "0.2rem" }}>Type</div>
              <select value={act.type} onChange={(e) => onUpdate(i, "type", e.target.value as ActivityType)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="FLEXIBLE" style={{ background: "#020c1b" }}>Flexible</option>
                <option value="FIXED"    style={{ background: "#020c1b" }}>Fixed</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#a0c4e0", fontSize: "0.65rem", marginBottom: "0.2rem" }}>Priority</div>
              <select value={act.priority} onChange={(e) => onUpdate(i, "priority", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {["LOW","MEDIUM","HIGH","CRITICAL"].map((p) => <option key={p} value={p} style={{ background: "#020c1b" }}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Row 4: Days */}
          <div>
            <div style={{ color: "#a0c4e0", fontSize: "0.65rem", marginBottom: "0.35rem" }}>Repeat days</div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {DAYS.map((d) => {
                const on = act.repeatDays.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() => {
                      const next = on ? act.repeatDays.filter((x) => x !== d) : [...act.repeatDays, d]
                      onUpdate(i, "repeatDays", next)
                    }}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: on ? "rgba(0,200,255,0.2)" : "rgba(255,255,255,0.04)",
                      border: on ? "1px solid rgba(0,200,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      color: on ? "#00c8ff" : "#a0c4e0",
                      fontSize: "0.68rem", fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title={DAY_FULL[d]}
                  >
                    {DAY_LABELS[d]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={onAdd}
        style={{
          background: "rgba(0,200,255,0.05)", border: "1px dashed rgba(0,200,255,0.25)",
          borderRadius: 8, padding: "0.6rem",
          color: "#00c8ff", fontSize: "0.8rem",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
        }}
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  )
}
