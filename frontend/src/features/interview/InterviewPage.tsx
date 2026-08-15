import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, ChevronDown, ChevronUp, Code2,
  Brain, MessageSquare, Filter, Loader2, CheckCircle2, Clock,
} from "lucide-react"
import { interviewService, type InterviewQuestion, type Difficulty, type InterviewType } from "./interview.service"

// ── Config ────────────────────────────────────────────────────────────────────

const DIFFICULTIES: { key: Difficulty; label: string; color: string; bg: string; border: string }[] = [
  { key: "EASY",   label: "Easy",   color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.3)"  },
  { key: "MEDIUM", label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.35)" },
  { key: "HARD",   label: "Hard",   color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.4)" },
]

const TYPES: { key: InterviewType; label: string; icon: React.ElementType; color: string }[] = [
  { key: "CONCEPTUAL", label: "Conceptual", icon: Brain,          color: "#a78bfa" },
  { key: "CODING",     label: "Coding",     icon: Code2,          color: "#60a5fa" },
  { key: "BEHAVIORAL", label: "Behavioral", icon: MessageSquare,  color: "#f59e0b" },
]

function getDifficulty(key: string) {
  return DIFFICULTIES.find((d) => d.key === key) ?? DIFFICULTIES[1]
}
function getType(key: string) {
  return TYPES.find((t) => t.key === key) ?? TYPES[0]
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const queryClient = useQueryClient()

  // Filters
  const [filterTopic, setFilterTopic]  = useState("")
  const [filterDiff,  setFilterDiff]   = useState("")
  const [filterType,  setFilterType]   = useState("")

  // UI state
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [expandedId,   setExpandedId]  = useState<string | null>(null)
  const [answeringId,  setAnsweringId] = useState<string | null>(null)
  const [answerText,   setAnswerText]  = useState("")
  const [showAttempts, setShowAttempts] = useState(false)

  // Add form state
  const [form, setForm] = useState({
    question: "", topic: "", difficulty: "MEDIUM" as Difficulty, type: "CONCEPTUAL" as InterviewType,
  })
  const [formErr, setFormErr] = useState("")

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["interview-questions"],
    queryFn: () => interviewService.getQuestions(),
    staleTime: 1000 * 60 * 5,
  })

  const { data: attempts = [] } = useQuery({
    queryKey: ["interview-attempts"],
    queryFn: interviewService.getMyAttempts,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addQuestion = useMutation({
    mutationFn: () => interviewService.createQuestion({
      question: form.question.trim(),
      topic:    form.topic.trim(),
      difficulty: form.difficulty,
      type:       form.type,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-questions"] })
      setForm({ question: "", topic: "", difficulty: "MEDIUM", type: "CONCEPTUAL" })
      setShowAddForm(false)
      setFormErr("")
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormErr(msg ?? "Failed to add question")
    },
  })

  const deleteQuestion = useMutation({
    mutationFn: interviewService.deleteQuestion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interview-questions"] }),
  })

  const submitAttempt = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
      interviewService.submitAttempt(questionId, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-attempts"] })
      queryClient.invalidateQueries({ queryKey: ["interview-questions"] })
      setAnsweringId(null)
      setAnswerText("")
    },
  })

  const deleteAttempt = useMutation({
    mutationFn: interviewService.deleteAttempt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interview-attempts"] }),
  })

  // ── Filtered questions ────────────────────────────────────────────────────

  const filtered = useMemo(() => questions.filter((q) => {
    if (filterDiff  && q.difficulty !== filterDiff)  return false
    if (filterType  && q.type       !== filterType)  return false
    if (filterTopic && !q.topic.toLowerCase().includes(filterTopic.toLowerCase())) return false
    return true
  }), [questions, filterDiff, filterType, filterTopic])

  // Unique topics for the filter input autocomplete
  const allTopics = useMemo(() =>
    [...new Set(questions.map((q) => q.topic))].sort()
  , [questions])

  // Stats
  const totalAttempted = new Set(attempts.map((a) => a.questionId)).size
  const avgScore = attempts.filter((a) => a.score != null).length > 0
    ? Math.round(attempts.filter((a) => a.score != null).reduce((s, a) => s + (a.score ?? 0), 0) / attempts.filter((a) => a.score != null).length)
    : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 760 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h1 style={{ color: "#e2f0ff", fontSize: "1.6rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Interview Prep
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", margin: "0.3rem 0 0" }}>
              Practice questions, write answers, track progress
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setShowAttempts(!showAttempts)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                background: showAttempts ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${showAttempts ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: showAttempts ? "#60a5fa" : "rgba(255,255,255,0.4)",
                borderRadius: 8, padding: "0.5rem 0.9rem",
                fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              <CheckCircle2 size={14} />
              My Attempts
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setShowAddForm(true); setFormErr("") }}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
                border: "1px solid rgba(0,200,255,0.3)",
                color: "#fff", borderRadius: 8, padding: "0.5rem 1rem",
                fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} />
              Add Question
            </motion.button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: "flex", gap: "1.5rem", flexWrap: "wrap",
          padding: "0.7rem 1rem",
          background: "rgba(0,10,30,0.5)",
          border: "1px solid rgba(0,200,255,0.08)",
          borderRadius: 8,
        }}>
          <StatPill label="Questions"  value={questions.length} />
          <StatPill label="Attempted"  value={totalAttempted}   color="#60a5fa" />
          <StatPill label="Remaining"  value={questions.length - totalAttempted} color="#f59e0b" />
          {avgScore !== null && <StatPill label="Avg Score" value={`${avgScore}/10`} color="#4ade80" />}
          <StatPill label="Total Attempts" value={attempts.length} />
        </div>
      </motion.div>

      {/* Add Question form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              background: "rgba(0,10,30,0.75)",
              border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: 10, padding: "1.25rem", marginBottom: "1rem",
            }}
          >
            <div style={{ color: "#e2f0ff", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.85rem" }}>
              Add Interview Question
            </div>

            {/* Question text */}
            <textarea
              autoFocus
              placeholder="Write the interview question..."
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, height: "auto", resize: "vertical", padding: "0.65rem 0.9rem", fontFamily: "inherit" }}
            />

            {/* Topic */}
            <input
              placeholder="Topic (e.g. JavaScript, React, System Design)"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              style={{ ...inputStyle, marginTop: "0.5rem" }}
              list="topic-suggestions"
            />
            <datalist id="topic-suggestions">
              {allTopics.map((t) => <option key={t} value={t} />)}
            </datalist>

            {/* Difficulty + Type row */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
              <div>
                <div style={labelStyle}>Difficulty</div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setForm((f) => ({ ...f, difficulty: d.key }))}
                      style={{
                        padding: "0.28rem 0.7rem", borderRadius: 20,
                        border: `1px solid ${form.difficulty === d.key ? d.border : "rgba(255,255,255,0.08)"}`,
                        background: form.difficulty === d.key ? d.bg : "rgba(255,255,255,0.02)",
                        color: form.difficulty === d.key ? d.color : "rgba(255,255,255,0.3)",
                        fontSize: "0.72rem", fontWeight: form.difficulty === d.key ? 600 : 400,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >{d.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Type</div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setForm((f) => ({ ...f, type: t.key }))}
                      style={{
                        padding: "0.28rem 0.7rem", borderRadius: 20,
                        border: `1px solid ${form.type === t.key ? `${t.color}55` : "rgba(255,255,255,0.08)"}`,
                        background: form.type === t.key ? `${t.color}18` : "rgba(255,255,255,0.02)",
                        color: form.type === t.key ? t.color : "rgba(255,255,255,0.3)",
                        fontSize: "0.72rem", fontWeight: form.type === t.key ? 600 : 400,
                        cursor: "pointer", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: "0.3rem",
                      }}
                    >
                      <t.icon size={10} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formErr && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.5rem 0 0" }}>▸ {formErr}</p>}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
              <button
                onClick={() => addQuestion.mutate()}
                disabled={addQuestion.isPending || !form.question.trim() || !form.topic.trim()}
                style={{
                  background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
                  border: "1px solid rgba(0,200,255,0.3)", color: "#fff",
                  borderRadius: 6, padding: "0 1rem", height: 36,
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                  opacity: addQuestion.isPending || !form.question.trim() || !form.topic.trim() ? 0.6 : 1,
                }}
              >
                {addQuestion.isPending ? "Adding..." : "Add Question"}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setFormErr("") }}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.35)", borderRadius: 6,
                  padding: "0 0.75rem", height: 36, fontSize: "0.82rem", cursor: "pointer",
                }}
              >Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Attempts panel */}
      <AnimatePresence>
        {showAttempts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", marginBottom: "1rem" }}
          >
            <div style={{
              background: "rgba(0,10,30,0.6)",
              border: "1px solid rgba(96,165,250,0.15)",
              borderTop: "2px solid #60a5fa",
              borderRadius: 10, padding: "1rem 1.25rem",
            }}>
              <div style={{ color: "#60a5fa", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.85rem" }}>
                My Attempts ({attempts.length})
              </div>
              {attempts.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", margin: 0 }}>
                  No attempts yet — answer some questions below.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 280, overflowY: "auto" }}>
                  {attempts.map((a) => (
                    <div key={a.id} style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 8, padding: "0.65rem 0.85rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#e2f0ff", fontSize: "0.78rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                            {a.question.question}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", lineHeight: 1.5 }}>
                            {a.answer.length > 120 ? a.answer.slice(0, 120) + "…" : a.answer}
                          </div>
                          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.35rem" }}>
                            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem" }}>
                              <Clock size={9} style={{ display: "inline", marginRight: 3 }} />
                              {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                            {a.score != null && (
                              <span style={{ color: "#4ade80", fontSize: "0.65rem", fontWeight: 700 }}>
                                Score: {a.score}/10
                              </span>
                            )}
                            {a.aiFeedback && (
                              <span style={{ color: "#a78bfa", fontSize: "0.65rem" }}>AI feedback available</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAttempt.mutate(a.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.15)", padding: "0.15rem", flexShrink: 0, transition: "color 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.15)"}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <Filter size={12} color="rgba(255,255,255,0.3)" />

        {/* Difficulty filters */}
        {DIFFICULTIES.map((d) => (
          <button key={d.key} onClick={() => setFilterDiff(filterDiff === d.key ? "" : d.key)}
            style={{
              padding: "0.25rem 0.65rem", borderRadius: 20,
              border: `1px solid ${filterDiff === d.key ? d.border : "rgba(255,255,255,0.07)"}`,
              background: filterDiff === d.key ? d.bg : "rgba(255,255,255,0.02)",
              color: filterDiff === d.key ? d.color : "rgba(255,255,255,0.3)",
              fontSize: "0.7rem", fontWeight: filterDiff === d.key ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >{d.label}</button>
        ))}

        {/* Type filters */}
        {TYPES.map((t) => (
          <button key={t.key} onClick={() => setFilterType(filterType === t.key ? "" : t.key)}
            style={{
              padding: "0.25rem 0.65rem", borderRadius: 20,
              border: `1px solid ${filterType === t.key ? `${t.color}55` : "rgba(255,255,255,0.07)"}`,
              background: filterType === t.key ? `${t.color}18` : "rgba(255,255,255,0.02)",
              color: filterType === t.key ? t.color : "rgba(255,255,255,0.3)",
              fontSize: "0.7rem", cursor: "pointer", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "0.25rem",
            }}
          >
            <t.icon size={9} />{t.label}
          </button>
        ))}

        {/* Topic search */}
        <input
          placeholder="Search topic..."
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          style={{
            ...inputStyle, height: 30, fontSize: "0.75rem",
            flex: "0 0 auto", width: 130,
          }}
        />

        {(filterDiff || filterType || filterTopic) && (
          <button onClick={() => { setFilterDiff(""); setFilterType(""); setFilterTopic("") }}
            style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.3)",
              fontSize: "0.7rem", cursor: "pointer", padding: "0 0.25rem",
            }}
          >✕ Clear</button>
        )}
      </div>

      {/* Question count */}
      {filtered.length !== questions.length && (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>
          Showing {filtered.length} of {questions.length} questions
        </div>
      )}

      {/* Questions list */}
      {isLoading ? (
        <LoadingRows />
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setShowAddForm(true)} hasFilters={!!(filterDiff || filterType || filterTopic)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <AnimatePresence>
            {filtered.map((q, i) => {
              const diff      = getDifficulty(q.difficulty)
              const typeConf  = getType(q.type)
              const TypeIcon  = typeConf.icon
              const isExpanded  = expandedId  === q.id
              const isAnswering = answeringId === q.id
              const myAttempts  = attempts.filter((a) => a.questionId === q.id)
              const attempted   = myAttempts.length > 0

              return (
                <motion.div
                  key={q.id} layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: i * 0.02 }}
                  style={{
                    background: attempted ? "rgba(74,222,128,0.03)" : "rgba(0,10,30,0.6)",
                    border: `1px solid ${attempted ? "rgba(74,222,128,0.12)" : "rgba(0,200,255,0.08)"}`,
                    borderLeft: `3px solid ${diff.color}`,
                    borderRadius: 10, overflow: "hidden",
                  }}
                >
                  {/* Question header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.9rem 1rem" }}>

                    {/* Type icon */}
                    <div style={{
                      width: 30, height: 30, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      background: `${typeConf.color}18`,
                      border: `1px solid ${typeConf.color}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <TypeIcon size={14} color={typeConf.color} />
                    </div>

                    {/* Question text + meta */}
                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : q.id)}>
                      <div style={{
                        color: "#e2f0ff", fontSize: "0.875rem", fontWeight: 500,
                        lineHeight: 1.5,
                      }}>
                        {q.question}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                        {/* Topic badge */}
                        <span style={{
                          color: "#00c8ff", fontSize: "0.65rem",
                          background: "rgba(0,200,255,0.07)",
                          border: "1px solid rgba(0,200,255,0.15)",
                          borderRadius: 4, padding: "0.1rem 0.4rem",
                        }}>{q.topic}</span>
                        {/* Difficulty */}
                        <span style={{
                          color: diff.color, fontSize: "0.65rem",
                          background: diff.bg, border: `1px solid ${diff.border}`,
                          borderRadius: 4, padding: "0.1rem 0.4rem", fontWeight: 600,
                        }}>{diff.label}</span>
                        {/* Type */}
                        <span style={{ color: typeConf.color, fontSize: "0.65rem" }}>
                          {typeConf.label}
                        </span>
                        {/* Attempted badge */}
                        {attempted && (
                          <span style={{
                            color: "#4ade80", fontSize: "0.65rem",
                            background: "rgba(74,222,128,0.08)",
                            border: "1px solid rgba(74,222,128,0.2)",
                            borderRadius: 4, padding: "0.1rem 0.4rem",
                            display: "flex", alignItems: "center", gap: "0.2rem",
                          }}>
                            <CheckCircle2 size={9} />
                            {myAttempts.length} attempt{myAttempts.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Answer button */}
                    {!isAnswering && (
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => { setAnsweringId(q.id); setAnswerText(""); setExpandedId(null) }}
                        style={{
                          background: "rgba(0,200,255,0.08)",
                          border: "1px solid rgba(0,200,255,0.2)",
                          color: "#00c8ff", borderRadius: 6,
                          padding: "0.3rem 0.7rem", fontSize: "0.72rem",
                          fontWeight: 600, cursor: "pointer", flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Answer
                      </motion.button>
                    )}

                    {/* Expand */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: "0.2rem", flexShrink: 0, display: "flex", alignItems: "center" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Delete question */}
                    <button
                      onClick={() => deleteQuestion.mutate(q.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.12)", padding: "0.2rem", flexShrink: 0, display: "flex", alignItems: "center" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.12)"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Answer editor */}
                  <AnimatePresence>
                    {isAnswering && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ borderTop: "1px solid rgba(0,200,255,0.08)", padding: "0.85rem 1rem" }}>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", marginBottom: "0.45rem" }}>
                            Write your answer:
                          </div>
                          <textarea
                            autoFocus
                            rows={5}
                            placeholder="Type your answer here... Be detailed and explain your thinking."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            style={{
                              ...inputStyle, height: "auto", resize: "vertical",
                              padding: "0.65rem 0.9rem", fontFamily: "inherit", fontSize: "0.82rem",
                              lineHeight: 1.6,
                            }}
                          />
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                            <motion.button
                              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              onClick={() => submitAttempt.mutate({ questionId: q.id, answer: answerText })}
                              disabled={!answerText.trim() || submitAttempt.isPending}
                              style={{
                                background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
                                border: "1px solid rgba(0,200,255,0.3)", color: "#fff",
                                borderRadius: 6, padding: "0 1rem", height: 36,
                                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                                opacity: !answerText.trim() || submitAttempt.isPending ? 0.6 : 1,
                                display: "flex", alignItems: "center", gap: "0.35rem",
                              }}
                            >
                              {submitAttempt.isPending && <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />}
                              {submitAttempt.isPending ? "Submitting..." : "Submit Answer"}
                            </motion.button>
                            <button
                              onClick={() => { setAnsweringId(null); setAnswerText("") }}
                              style={{
                                background: "none", border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.3)", borderRadius: 6,
                                padding: "0 0.7rem", height: 36, fontSize: "0.8rem", cursor: "pointer",
                              }}
                            >Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Previous attempts (expanded) */}
                  <AnimatePresence>
                    {isExpanded && myAttempts.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem 1rem" }}>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Your previous answers
                          </div>
                          {myAttempts.map((a) => (
                            <div key={a.id} style={{
                              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                              borderRadius: 7, padding: "0.6rem 0.8rem", marginBottom: "0.4rem",
                            }}>
                              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", lineHeight: 1.6 }}>
                                {a.answer}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", alignItems: "center" }}>
                                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem" }}>
                                  {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                                </span>
                                {a.score != null && (
                                  <span style={{ color: "#4ade80", fontSize: "0.72rem", fontWeight: 700 }}>
                                    {a.score}/10
                                  </span>
                                )}
                              </div>
                              {a.aiFeedback && (
                                <div style={{
                                  marginTop: "0.4rem", padding: "0.4rem 0.6rem",
                                  background: "rgba(167,139,250,0.06)", borderRadius: 5,
                                  color: "#a78bfa", fontSize: "0.72rem", lineHeight: 1.5,
                                }}>
                                  🤖 {a.aiFeedback}
                                </div>
                              )}
                            </div>
                          ))}
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div>
      <div style={{ color: color ?? "#00c8ff", fontSize: "1.05rem", fontWeight: 700 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>{label}</div>
    </div>
  )
}

function LoadingRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {[0.9, 0.7, 0.5, 0.35].map((o, i) => (
        <div key={i} style={{
          height: 74, borderRadius: 10,
          background: "rgba(0,10,30,0.6)",
          border: "1px solid rgba(0,200,255,0.06)",
          borderLeft: "3px solid rgba(0,200,255,0.1)",
          display: "flex", alignItems: "center", padding: "0 1rem", gap: "0.75rem",
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: `rgba(0,200,255,${o * 0.08})`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 13, borderRadius: 5, background: `rgba(0,200,255,${o * 0.07})`, maxWidth: `${300 - i * 40}px`, marginBottom: 8 }} />
            <div style={{ height: 10, borderRadius: 5, background: `rgba(0,200,255,${o * 0.05})`, maxWidth: 160 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onAdd, hasFilters }: { onAdd: () => void; hasFilters: boolean }) {
  return (
    <div style={{
      textAlign: "center", padding: "3rem 1rem",
      border: "1px dashed rgba(0,200,255,0.15)", borderRadius: 10,
    }}>
      <Code2 size={32} color="rgba(0,200,255,0.2)" style={{ margin: "0 auto 0.75rem" }} />
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", margin: "0 0 1rem" }}>
        {hasFilters ? "No questions match your filters." : "No questions yet."}
      </p>
      {!hasFilters && (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onAdd}
          style={{
            background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.25)",
            color: "#00c8ff", borderRadius: 8, padding: "0.5rem 1.2rem",
            fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          + Add your first question
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

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.35)", fontSize: "0.7rem",
  marginBottom: "0.35rem",
}
