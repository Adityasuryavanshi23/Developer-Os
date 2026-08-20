import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Target, Zap, Clock, BookOpen } from "lucide-react"
import { taskService } from "../tasks/task.service"
import { skillService, topicService, careerGoalService } from "../learning/learning.service"
import { revisionService } from "../revision/revision.service"
import { analyticsService } from "../analytics/analytics.service"
import { useAuthStore } from "../auth/auth.store"

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "today"],
    queryFn: taskService.getToday,
  })

  const { data: _allTasks = [] } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: taskService.getAll,
  })

  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: skillService.getAll,
  })

  const { data: _topics = [] } = useQuery({
    queryKey: ["topics"],
    queryFn: topicService.getAll,
  })

  const { data: _careerGoal = null } = useQuery({
    queryKey: ["career-goal"],
    queryFn: careerGoalService.get,
  })

  const { data: _revisions = [] } = useQuery({
    queryKey: ["revisions"],
    queryFn: revisionService.getAll,
  })

  const { data: _analytics = null } = useQuery({
    queryKey: ["analytics"],
    queryFn: analyticsService.get,
  })


  const completeMutation = useMutation({
    mutationFn: taskService.complete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "today"] }),
  })

  const completed  = tasks.filter((t) => t.status === "COMPLETED").length
  const total      = tasks.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: "2rem" }}
      >
        <div style={{ color: "rgba(0,200,255,0.5)", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
          {today}
        </div>
        <h1 style={{ color: "#e2f0ff", fontSize: "1.75rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Good {getGreeting()}, {user?.name?.split(" ")[0] ?? "Developer"} 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
          Here's your learning status for today.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="stats-grid"
        style={{ marginBottom: "2rem" }}
      >
        <StatCard icon={<CheckCircle2 size={18} color="#00c8ff" />} label="Tasks Done" value={`${completed}/${total}`} sub="today" />
        <StatCard icon={<Zap size={18} color="#f59e0b" />} label="Completion" value={`${percentage}%`} sub="today's progress" />
        <StatCard icon={<BookOpen size={18} color="#a78bfa" />} label="Skills" value={String(skills.length)} sub="being tracked" />
      </motion.div>

      {/* Two columns */}
      <div className="dashboard-grid">

        {/* Today's Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={cardStyle}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={cardTitle}>Today's Tasks</h2>
            <span style={{ color: "rgba(0,200,255,0.5)", fontSize: "0.78rem" }}>
              {completed}/{total} done
            </span>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div style={{ height: 4, background: "rgba(0,200,255,0.1)", borderRadius: 2, marginBottom: "1.25rem", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ height: "100%", background: "linear-gradient(90deg, #0ea5e9, #00c8ff)", borderRadius: 2 }}
              />
            </div>
          )}

          {tasksLoading ? (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}>Loading...</div>
          ) : tasks.length === 0 ? (
            <EmptyState icon={<Clock size={28} />} text="No tasks scheduled for today." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={() => completeMutation.mutate(task.id)}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={cardStyle}
        >
          <h2 style={{ ...cardTitle, marginBottom: "1.25rem" }}>Skills</h2>

          {skills.length === 0 ? (
            <EmptyState icon={<Target size={28} />} text="No skills added yet. Complete onboarding to get started." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {skills.map((skill) => (
                <div key={skill.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ color: "#e2f0ff", fontSize: "0.85rem", fontWeight: 500 }}>{skill.name}</span>
                    <span style={{ color: "rgba(0,200,255,0.6)", fontSize: "0.75rem" }}>{skill.level}%</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        background: "linear-gradient(90deg, #7c3aed, #0ea5e9)",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string
}) {
  return (
    <div style={{
      background: "rgba(0,10,30,0.6)",
      border: "1px solid rgba(0,200,255,0.1)",
      borderRadius: 10, padding: "1.1rem 1.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
        {icon}
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>{label}</span>
      </div>
      <div style={{ color: "#e2f0ff", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", marginTop: "0.3rem" }}>{sub}</div>
    </div>
  )
}

function TaskRow({ task, onComplete }: {
  task: ReturnType<typeof taskService.getToday> extends Promise<(infer T)[]> ? T : never
  onComplete: () => void
}) {
  const done = task.status === "COMPLETED"

  const priorityColor: Record<string, string> = {
    LOW: "rgba(255,255,255,0.2)",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
  }

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "0.75rem",
      padding: "0.6rem 0.75rem", borderRadius: 7,
      background: done ? "rgba(0,200,255,0.04)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${done ? "rgba(0,200,255,0.12)" : "rgba(255,255,255,0.06)"}`,
      cursor: done ? "default" : "pointer",
      transition: "all 0.15s",
    }}
      onClick={() => !done && onComplete()}
    >
      {done
        ? <CheckCircle2 size={16} color="#00c8ff" style={{ marginTop: 2, flexShrink: 0 }} />
        : <Circle size={16} color="rgba(255,255,255,0.2)" style={{ marginTop: 2, flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: done ? "rgba(255,255,255,0.3)" : "#e2f0ff",
          fontSize: "0.85rem", fontWeight: 500,
          textDecoration: done ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {task.title}
        </div>
        {task.topic && (
          <div style={{ color: "rgba(0,200,255,0.4)", fontSize: "0.72rem", marginTop: "0.15rem" }}>
            {task.topic.name}
          </div>
        )}
      </div>
      <div style={{
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
        background: priorityColor[task.priority] ?? "rgba(255,255,255,0.2)",
      }} />
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 1rem", color: "rgba(255,255,255,0.2)" }}>
      <div style={{ marginBottom: "0.75rem", opacity: 0.4 }}>{icon}</div>
      <p style={{ fontSize: "0.82rem", margin: 0 }}>{text}</p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "rgba(0,10,30,0.6)",
  border: "1px solid rgba(0,200,255,0.1)",
  borderRadius: 10, padding: "1.5rem",
}

const cardTitle: React.CSSProperties = {
  color: "#e2f0ff", fontSize: "1rem", fontWeight: 600, margin: 0,
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}
