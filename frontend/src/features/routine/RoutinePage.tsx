import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDays } from "lucide-react"
import { routineService } from "./routine.service"
import RoutineWizard from "./RoutineWizard"
import RoutineDailyView from "./RoutineDailyView"
import RoutineEditTable from "./RoutineEditTable"

type View = "daily" | "edit" | "wizard"

export default function RoutinePage() {
  const qc = useQueryClient()
  const [view, setView] = useState<View>("daily")

  const { data: routine, isLoading } = useQuery({
    queryKey: ["routine"],
    queryFn: routineService.getRoutine,
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ color: "#a0c4e0", fontSize: "0.85rem", fontFamily: "monospace" }}>Loading…</div>
      </div>
    )
  }

  // ── First time — no routine exists ────────────────────────────────────────
  if (!routine || view === "wizard") {
    return (
      <RoutineWizard
        onComplete={() => {
          setView("daily")
          qc.invalidateQueries({ queryKey: ["routine"] })
          qc.invalidateQueries({ queryKey: ["routine", "today"] })
        }}
      />
    )
  }

  // ── Edit table view ───────────────────────────────────────────────────────
  if (view === "edit") {
    return (
      <div style={{ minHeight: "100%", background: "#020c1b" }}>
        <PageHeader name={routine.name} view={view} onViewChange={setView} />
        <RoutineEditTable onBack={() => setView("daily")} />
      </div>
    )
  }

  // ── Daily view ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100%", background: "#020c1b" }}>
      <PageHeader name={routine.name} view={view} onViewChange={setView} />
      <RoutineDailyView onGoToWizard={() => setView("edit")} />
    </div>
  )
}

// ── Shared page header ────────────────────────────────────────────────────────
function PageHeader({ name, view, onViewChange }: { name: string; view: View; onViewChange: (v: View) => void }) {
  return (
    <div style={{
      padding: "1.25rem 1.5rem",
      borderBottom: "1px solid rgba(0,200,255,0.1)",
      background: "rgba(0,200,255,0.02)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "0.75rem",
    }}>
      {/* Left — icon + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(0,200,255,0.1)",
          border: "1px solid rgba(0,200,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 16px rgba(0,200,255,0.1)",
        }}>
          <CalendarDays size={18} color="#00c8ff" />
        </div>
        <div>
          <div style={{ color: "#e2f0ff", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
            My Routine
          </div>
          <div style={{ color: "#a0c4e0", fontSize: "0.7rem", marginTop: "0.1rem" }}>
            {name} · {view === "edit" ? "Editing activities" : "Daily schedule tracker"}
          </div>
        </div>
      </div>

      {/* Right — tab switcher */}
      <div style={{ display: "flex", gap: "0.4rem" }}>
        {(["daily", "edit"] as View[]).map((v) => (
          <button key={v} onClick={() => onViewChange(v)}
            style={{
              background: view === v ? "rgba(0,200,255,0.12)" : "rgba(255,255,255,0.04)",
              border: view === v ? "1px solid rgba(0,200,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "0.35rem 0.85rem",
              color: view === v ? "#00c8ff" : "#a0c4e0",
              fontSize: "0.75rem", fontWeight: view === v ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {v === "daily" ? "Today" : "Edit"}
          </button>
        ))}
      </div>
    </div>
  )
}
