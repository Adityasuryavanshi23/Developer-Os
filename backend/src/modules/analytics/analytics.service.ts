import { prisma } from "../../database/prisma"

// Returns last N days as YYYY-MM-DD strings (local)
function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export async function getAnalytics(userId: string) {
  // ── 1. Tasks last 14 days ────────────────────────────────────────────────
  const days14 = lastNDays(14)
  const allTasks = await prisma.task.findMany({
    where: { userId },
    select: { status: true, scheduledAt: true, completedAt: true, priority: true },
  })

  const tasksByDay = days14.map((d) => {
    const dayTasks = allTasks.filter((t) => t.scheduledAt.toISOString().slice(0, 10) === d)
    return {
      date: dayLabel(d),
      total:     dayTasks.length,
      completed: dayTasks.filter((t) => t.status === "COMPLETED").length,
      missed:    dayTasks.filter((t) => t.status === "MISSED").length,
    }
  })

  // ── 2. Task status breakdown (pie) ──────────────────────────────────────
  const statusCounts = {
    PENDING:         allTasks.filter((t) => t.status === "PENDING").length,
    IN_PROGRESS:     allTasks.filter((t) => t.status === "IN_PROGRESS").length,
    COMPLETED:       allTasks.filter((t) => t.status === "COMPLETED").length,
    MISSED:          allTasks.filter((t) => t.status === "MISSED").length,
    CARRIED_FORWARD: allTasks.filter((t) => t.status === "CARRIED_FORWARD").length,
  }
  const taskStatusPie = [
    { name: "Completed",       value: statusCounts.COMPLETED,       fill: "#4ade80" },
    { name: "Pending",         value: statusCounts.PENDING,         fill: "#f59e0b" },
    { name: "In Progress",     value: statusCounts.IN_PROGRESS,     fill: "#60a5fa" },
    { name: "Missed",          value: statusCounts.MISSED,          fill: "#f87171" },
    { name: "Carried Forward", value: statusCounts.CARRIED_FORWARD, fill: "#a78bfa" },
  ].filter((s) => s.value > 0)

  // ── 3. Revisions last 14 days ────────────────────────────────────────────
  const allRevisions = await prisma.revision.findMany({
    where: { userId },
    select: { status: true, scheduledAt: true, completedAt: true },
  })

  const revisionsByDay = days14.map((d) => {
    const dayRevs = allRevisions.filter((r) => r.scheduledAt.toISOString().slice(0, 10) === d)
    return {
      date:      dayLabel(d),
      due:       dayRevs.length,
      completed: dayRevs.filter((r) => r.status === "COMPLETED").length,
    }
  })

  // ── 4. Skills progress ───────────────────────────────────────────────────
  const skills = await prisma.skill.findMany({
    where: { userId },
    select: {
      name: true,
      topics: {
        select: { status: true },
        where: { userId },
      },
    },
  })

  const skillsProgress = skills.map((s) => {
    const total     = s.topics.length
    const completed = s.topics.filter((t) => t.status === "COMPLETED").length
    const inProg    = s.topics.filter((t) => t.status === "IN_PROGRESS").length
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
    return { name: s.name, total, completed, inProgress: inProg, percent: pct }
  }).sort((a, b) => b.percent - a.percent)

  // ── 5. Streak — consecutive days with at least 1 completed task ──────────
  let streak = 0
  const today = new Date().toISOString().slice(0, 10)
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    const hadCompletion = allTasks.some(
      (t) => t.completedAt && t.completedAt.toISOString().slice(0, 10) === ds
    )
    // Allow today to not break streak even if nothing done yet
    if (ds === today || hadCompletion) {
      if (ds === today && !hadCompletion) continue
      streak++
    } else {
      break
    }
  }

  // ── 6. Summary stats ─────────────────────────────────────────────────────
  const summary = {
    totalTasks:       allTasks.length,
    completedTasks:   statusCounts.COMPLETED,
    totalRevisions:   allRevisions.length,
    completedRevisions: allRevisions.filter((r) => r.status === "COMPLETED").length,
    totalSkills:      skills.length,
    totalTopics:      skills.reduce((acc, s) => acc + s.topics.length, 0),
    completedTopics:  skills.reduce((acc, s) => acc + s.topics.filter((t) => t.status === "COMPLETED").length, 0),
    streak,
    completionRate:   allTasks.length > 0 ? Math.round((statusCounts.COMPLETED / allTasks.length) * 100) : 0,
  }

  return { summary, tasksByDay, taskStatusPie, revisionsByDay, skillsProgress }
}
