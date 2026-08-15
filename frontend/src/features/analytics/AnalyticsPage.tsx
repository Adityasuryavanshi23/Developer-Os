import { memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { analyticsService } from "./analytics.service"
import {
  CheckCircle2, Flame, BookOpen, Brain, BarChart2, TrendingUp,
} from "lucide-react"

// ── Custom Tooltip — shared across all charts ────────────────────────────────
const ChartTooltip = memo(({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "rgba(5,15,40,0.97)",
      border: "1px solid rgba(0,200,255,0.2)",
      borderRadius: 8, padding: "0.6rem 0.85rem",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      {label && <div style={{ color: "#00c8ff", fontSize: "0.72rem", marginBottom: "0.4rem", fontWeight: 600 }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.name}:</span>
          <span style={{ color: "#e2f0ff", fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
})

// ── Chart card wrapper ────────────────────────────────────────────────────────
const ChartCard = memo(({ title, subtitle, children, accent = "#00c8ff" }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  accent?: string
}) => (
  <div style={{
    background: "rgba(0,10,30,0.6)",
    border: "1px solid rgba(0,200,255,0.08)",
    borderTop: `2px solid ${accent}`,
    borderRadius: 10, padding: "1.1rem 1.25rem",
  }}>
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ color: "#e2f0ff", fontSize: "0.875rem", fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", marginTop: "0.15rem" }}>{subtitle}</div>}
    </div>
    {children}
  </div>
))

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = memo(({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string
}) => (
  <div style={{
    background: "rgba(0,10,30,0.6)",
    border: `1px solid ${color}22`,
    borderLeft: `3px solid ${color}`,
    borderRadius: 10, padding: "1rem 1.1rem",
    display: "flex", alignItems: "center", gap: "0.85rem",
  }}>
    <div style={{
      background: `${color}18`, borderRadius: 8,
      padding: "0.55rem", flexShrink: 0,
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ color: "#e2f0ff", fontSize: "1.4rem", fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", marginTop: "0.25rem" }}>{label}</div>
      {sub && <div style={{ color, fontSize: "0.68rem", marginTop: "0.15rem", fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
))

// ── Recharts shared axis/grid style ──────────────────────────────────────────
const AXIS_STYLE   = { fill: "rgba(255,255,255,0.25)", fontSize: 11 }
const GRID_STYLE   = { stroke: "rgba(255,255,255,0.04)" }
const TICK_LINE    = false

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics"],
    queryFn: analyticsService.get,
    staleTime: 1000 * 60 * 2,   // 2 min cache — charts don't need live refresh
    refetchOnWindowFocus: false, // prevent re-fetch on tab switch = smoother UX
    retry: 1,
  })

  // memoize derived chart data so Recharts doesn't re-render on unrelated state changes
  const tasksByDay     = useMemo(() => data?.tasksByDay     ?? [], [data])
  const revsByDay      = useMemo(() => data?.revisionsByDay ?? [], [data])
  const taskStatusPie  = useMemo(() => data?.taskStatusPie  ?? [], [data])
  const skillsProgress = useMemo(() => data?.skillsProgress ?? [], [data])
  const summary        = data?.summary

  if (isLoading) return <SkeletonPage />

  if (isError) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", gap: "0.75rem", textAlign: "center" }}>
      <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "50%", padding: "0.85rem", display: "inline-flex" }}>
        <BarChart2 size={28} color="#f87171" />
      </div>
      <div style={{ color: "#f87171", fontSize: "0.9rem", fontWeight: 600 }}>Server temporarily unavailable</div>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", lineHeight: 1.6, maxWidth: 300 }}>
        Could not load analytics. Make sure the backend server is running and try again.
      </div>
    </div>
  )

  if (!summary) return (
    <div style={{ color: "rgba(255,255,255,0.3)", padding: "3rem", textAlign: "center", fontSize: "0.875rem" }}>
      No data yet — complete some tasks to see analytics.
    </div>
  )

  const completionRate = summary.completionRate

  return (
    <div style={{ maxWidth: 780 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ color: "#e2f0ff", fontSize: "1.6rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Analytics
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", margin: "0.3rem 0 0" }}>
          Your learning progress at a glance
        </p>
      </motion.div>

      {/* Summary stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}
      >
        <StatCard icon={Flame}        label="Day Streak"         value={summary.streak}            color="#fb923c" sub={summary.streak > 0 ? "keep going! 🔥" : "start today"} />
        <StatCard icon={CheckCircle2} label="Tasks Completed"    value={summary.completedTasks}    color="#4ade80" sub={`of ${summary.totalTasks} total`} />
        <StatCard icon={TrendingUp}   label="Completion Rate"    value={`${completionRate}%`}      color="#00c8ff" />
        <StatCard icon={Brain}        label="Revisions Done"     value={summary.completedRevisions} color="#a78bfa" sub={`of ${summary.totalRevisions} total`} />
        <StatCard icon={BookOpen}     label="Topics Completed"   value={summary.completedTopics}   color="#60a5fa" sub={`of ${summary.totalTopics} topics`} />
        <StatCard icon={BarChart2}    label="Skills Tracked"     value={summary.totalSkills}       color="#f59e0b" />
      </motion.div>

      {/* Row 1: Tasks bar + Status pie */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="analytics-row1"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}
      >
        {/* Tasks last 14 days — Bar chart */}
        <ChartCard title="Tasks — Last 14 Days" subtitle="Completed vs Missed per day" accent="#4ade80">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tasksByDay} barCategoryGap="30%" barGap={2}>
              <CartesianGrid vertical={false} {...GRID_STYLE} />
              <XAxis dataKey="date" tick={AXIS_STYLE} tickLine={TICK_LINE} axisLine={false} interval={1} />
              <YAxis tick={AXIS_STYLE} tickLine={TICK_LINE} axisLine={false} width={24} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="completed" name="Completed" fill="#4ade80" radius={[3, 3, 0, 0]} />
              <Bar dataKey="missed"    name="Missed"    fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Task status breakdown — Pie */}
        <ChartCard title="Task Status" subtitle="All time breakdown" accent="#f59e0b">
          {taskStatusPie.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: "0.8rem" }}>
              No tasks yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={taskStatusPie} dataKey="value" nameKey="name"
                  cx="50%" cy="45%" innerRadius={50} outerRadius={78}
                  paddingAngle={3}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={600}
                >
                  {taskStatusPie.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </motion.div>

      {/* Row 2: Revisions line chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: "0.75rem" }}
      >
        <ChartCard title="Revisions — Last 14 Days" subtitle="Due vs Completed" accent="#a78bfa">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revsByDay}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="date" tick={AXIS_STYLE} tickLine={TICK_LINE} axisLine={false} interval={1} />
              <YAxis tick={AXIS_STYLE} tickLine={TICK_LINE} axisLine={false} width={24} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(167,139,250,0.2)", strokeWidth: 1 }} />
              <Line
                type="monotone" dataKey="due" name="Due"
                stroke="rgba(167,139,250,0.4)" strokeWidth={2} dot={false}
                strokeDasharray="4 3"
              />
              <Line
                type="monotone" dataKey="completed" name="Completed"
                stroke="#a78bfa" strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, fill: "#a78bfa", stroke: "none" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Row 3: Skills progress — horizontal bars */}
      {skillsProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ChartCard title="Skills Progress" subtitle="Topics completed per skill" accent="#60a5fa">
            {skillsProgress.length <= 6 ? (
              // Inline custom bars — cleaner for small lists
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.25rem" }}>
                {skillsProgress.map((s) => (
                  <div key={s.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ color: "#e2f0ff", fontSize: "0.8rem", fontWeight: 500 }}>{s.name}</span>
                      <span style={{ color: "#60a5fa", fontSize: "0.75rem", fontWeight: 600 }}>
                        {s.completed}/{s.total} · {s.percent}%
                      </span>
                    </div>
                    <div style={{ height: 7, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.percent}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
                        style={{
                          height: "100%", borderRadius: 10,
                          background: s.percent === 100
                            ? "linear-gradient(90deg, #4ade80, #22c55e)"
                            : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                        }}
                      />
                    </div>
                    {s.inProgress > 0 && (
                      <div style={{ color: "rgba(245,158,11,0.6)", fontSize: "0.66rem", marginTop: "0.2rem" }}>
                        {s.inProgress} in progress
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Recharts horizontal bar for many skills
              <ResponsiveContainer width="100%" height={skillsProgress.length * 38}>
                <BarChart data={skillsProgress} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid horizontal={false} {...GRID_STYLE} />
                  <XAxis type="number" domain={[0, 100]} tick={AXIS_STYLE} tickLine={TICK_LINE} axisLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={AXIS_STYLE} tickLine={TICK_LINE} axisLine={false} width={90} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="percent" name="Completion %" radius={[0, 4, 4, 0]} fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </motion.div>
      )}

    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonBox({ h, w = "100%", r = 8 }: { h: number; w?: string | number; r?: number }) {
  return (
    <div className="shimmer" style={{ height: h, width: w, borderRadius: r }} />
  )
}

function SkeletonPage() {
  return (
    <div style={{ maxWidth: 900 }}>
      <SkeletonBox h={28} w={140} r={6} />
      <div style={{ marginTop: "0.4rem" }}><SkeletonBox h={14} w={220} r={4} /></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "1.75rem" }}>
        {[...Array(6)].map((_, i) => <SkeletonBox key={i} h={78} r={10} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
        <SkeletonBox h={280} r={10} />
        <SkeletonBox h={280} r={10} />
      </div>

      <div style={{ marginTop: "0.75rem" }}><SkeletonBox h={240} r={10} /></div>
      <div style={{ marginTop: "0.75rem" }}><SkeletonBox h={200} r={10} /></div>
    </div>
  )
}
