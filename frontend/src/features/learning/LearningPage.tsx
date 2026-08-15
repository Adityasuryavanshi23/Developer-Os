import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronRight, BookOpen, Circle, Clock, CheckCircle2, Loader2, Library } from "lucide-react"
import { skillService, topicService } from "./learning.service"
import type { Topic } from "./learning.service"
import CurriculumModal from "./CurriculumModal"
import TopicContentDrawer from "./TopicContentDrawer"

export default function LearningPage() {
  const queryClient = useQueryClient()
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [showCurriculum, setShowCurriculum] = useState(false)
  // Topic content drawer
  const [openTopic, setOpenTopic] = useState<{ topic: Topic; skillName: string } | null>(null)
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null)
  const [newTopicName, setNewTopicName] = useState("")
  const [skillError, setSkillError] = useState("")

  // ── Queries ──────────────────────────────────────────────────

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: skillService.getAll,
  })

  const { data: topics = [] } = useQuery({
    queryKey: ["topics"],
    queryFn: topicService.getAll,
  })

  // ── Mutations ────────────────────────────────────────────────

  const addSkill = useMutation({
    mutationFn: (name: string) => skillService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      setNewSkillName("")
      setAddingSkill(false)
      setSkillError("")
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSkillError(msg ?? "Failed to add skill")
    },
  })

  const deleteSkill = useMutation({
    mutationFn: skillService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skills"] }),
  })

  const addTopic = useMutation({
    mutationFn: ({ skillId, name }: { skillId: string; name: string }) =>
      topicService.create(skillId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] })
      setNewTopicName("")
      setAddingTopicFor(null)
    },
  })

  const updateTopic = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Topic["status"] }) =>
      topicService.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topics"] }),
  })

  const deleteTopic = useMutation({
    mutationFn: topicService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topics"] }),
  })

  // ── Helpers ──────────────────────────────────────────────────

  function topicsForSkill(skillId: string) {
    return topics.filter((t) => t.skillId === skillId)
  }

  function handleAddSkill() {
    if (!newSkillName.trim()) return
    addSkill.mutate(newSkillName.trim())
  }

  function handleAddTopic(skillId: string) {
    if (!newTopicName.trim()) return
    addTopic.mutate({ skillId, name: newTopicName.trim() })
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 720 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "2rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "#e2f0ff", fontSize: "1.6rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Learning
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", margin: "0.3rem 0 0" }}>
              Manage your skills and topics
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {/* Browse pre-built curriculum */}
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setShowCurriculum(true)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.3)",
                color: "#a78bfa", borderRadius: 8, padding: "0.5rem 1rem",
                fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Library size={15} />
              Browse Curriculum
            </motion.button>
            {/* Manual add skill */}
            <button
              onClick={() => { setAddingSkill(true); setSkillError("") }}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
                border: "1px solid rgba(0,200,255,0.3)",
                color: "#fff", borderRadius: 8, padding: "0.5rem 1rem",
                fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={15} />
              Add Skill
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{
          display: "flex", gap: "1.5rem", marginTop: "1.25rem",
          padding: "0.75rem 1rem",
          background: "rgba(0,10,30,0.5)",
          border: "1px solid rgba(0,200,255,0.08)",
          borderRadius: 8,
        }}>
          <Stat label="Skills" value={skills.length} />
          <Stat label="Topics" value={topics.length} />
          <Stat label="Completed" value={topics.filter((t) => t.status === "COMPLETED").length} color="#4ade80" />
          <Stat label="In Progress" value={topics.filter((t) => t.status === "IN_PROGRESS").length} color="#f59e0b" />
        </div>
      </motion.div>

      {/* Add Skill form */}
      <AnimatePresence>
        {addingSkill && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: "rgba(0,10,30,0.7)",
              border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: 10, padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ color: "#e2f0ff", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              New Skill
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                autoFocus
                type="text"
                placeholder="e.g. JavaScript, React, Node.js"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSkill()
                  if (e.key === "Escape") { setAddingSkill(false); setNewSkillName("") }
                }}
                style={inputStyle}
              />
              <ActionBtn onClick={handleAddSkill} loading={addSkill.isPending} label="Add" />
              <CancelBtn onClick={() => { setAddingSkill(false); setNewSkillName(""); setSkillError("") }} />
            </div>
            {skillError && <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.5rem 0 0" }}>▸ {skillError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skills list */}
      {isLoading ? (
        <LoadingRows />
      ) : skills.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {skills.map((skill, i) => {
            const skillTopics = topicsForSkill(skill.id)
            const isExpanded = expandedSkill === skill.id
            const doneCount = skillTopics.filter((t) => t.status === "COMPLETED").length

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: "rgba(0,10,30,0.6)",
                  border: "1px solid rgba(0,200,255,0.1)",
                  borderRadius: 10, overflow: "hidden",
                }}
              >
                {/* Skill row */}
                <div
                  onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.9rem 1.1rem", cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,200,255,0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {isExpanded
                    ? <ChevronDown size={16} color="rgba(0,200,255,0.6)" />
                    : <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  }
                  <BookOpen size={15} color={isExpanded ? "#00c8ff" : "rgba(255,255,255,0.3)"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e2f0ff", fontSize: "0.9rem", fontWeight: 600 }}>{skill.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
                      {skillTopics.length} topic{skillTopics.length !== 1 ? "s" : ""}
                      {skillTopics.length > 0 && ` · ${doneCount} done`}
                    </div>
                  </div>

                  {/* Progress pill */}
                  {skillTopics.length > 0 && (
                    <div style={{
                      background: "rgba(0,200,255,0.08)",
                      border: "1px solid rgba(0,200,255,0.15)",
                      borderRadius: 20, padding: "0.2rem 0.65rem",
                      fontSize: "0.72rem", color: "#00c8ff", fontWeight: 600,
                    }}>
                      {Math.round((doneCount / skillTopics.length) * 100)}%
                    </div>
                  )}

                  {/* Delete skill */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSkill.mutate(skill.id) }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.15)", padding: "0.25rem",
                      borderRadius: 4, transition: "color 0.15s",
                      display: "flex", alignItems: "center",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.15)"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Topics section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{
                        borderTop: "1px solid rgba(0,200,255,0.07)",
                        padding: "0.75rem 1.1rem 1rem",
                      }}>
                        {/* Topic rows */}
                        {skillTopics.length === 0 ? (
                          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem", margin: "0 0 0.75rem" }}>
                            No topics yet — add your first one below.
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
                            {skillTopics.map((topic) => (
                              <TopicRow
                                key={topic.id}
                                topic={topic}
                                loading={updateTopic.isPending && updateTopic.variables?.id === topic.id}
                                onStatusChange={(status) =>
                                  updateTopic.mutate({ id: topic.id, status })
                                }
                                onDelete={() => deleteTopic.mutate(topic.id)}
                                onOpen={() => setOpenTopic({ topic, skillName: skill.name })}
                              />
                            ))}
                          </div>
                        )}

                        {/* Add topic */}
                        {addingTopicFor === skill.id ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                              autoFocus
                              type="text"
                              placeholder="Topic name..."
                              value={newTopicName}
                              onChange={(e) => setNewTopicName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddTopic(skill.id)
                                if (e.key === "Escape") { setAddingTopicFor(null); setNewTopicName("") }
                              }}
                              style={{ ...inputStyle, fontSize: "0.82rem", height: 36 }}
                            />
                            <ActionBtn onClick={() => handleAddTopic(skill.id)} loading={addTopic.isPending} label="Add" small />
                            <CancelBtn onClick={() => { setAddingTopicFor(null); setNewTopicName("") }} small />
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingTopicFor(skill.id); setNewTopicName("") }}
                            style={{
                              display: "flex", alignItems: "center", gap: "0.4rem",
                              background: "none", border: "1px dashed rgba(0,200,255,0.2)",
                              color: "rgba(0,200,255,0.5)", borderRadius: 6,
                              padding: "0.35rem 0.75rem", fontSize: "0.78rem",
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "rgba(0,200,255,0.5)"
                              e.currentTarget.style.color = "#00c8ff"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "rgba(0,200,255,0.2)"
                              e.currentTarget.style.color = "rgba(0,200,255,0.5)"
                            }}
                          >
                            <Plus size={13} />
                            Add topic
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Curriculum modal */}
      <AnimatePresence>
        {showCurriculum && (
          <CurriculumModal onClose={() => setShowCurriculum(false)} />
        )}
      </AnimatePresence>

      {openTopic && (
        <TopicContentDrawer
          topic={openTopic.topic}
          skillName={openTopic.skillName}
          open={true}
          onClose={() => setOpenTopic(null)}
          onStatusChange={(status) => {
            updateTopic.mutate({ id: openTopic.topic.id, status })
            setOpenTopic(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Topic row ────────────────────────────────────────────────────────────────

type TopicStatus = Topic["status"]

const STATUSES: { key: TopicStatus; label: string; icon: React.ElementType; activeColor: string; activeBg: string; activeBorder: string }[] = [
  { key: "NOT_STARTED", label: "Todo",        icon: Circle,       activeColor: "rgba(255,255,255,0.8)", activeBg: "rgba(255,255,255,0.08)", activeBorder: "rgba(255,255,255,0.2)"  },
  { key: "IN_PROGRESS", label: "In Progress", icon: Clock,        activeColor: "#f59e0b",               activeBg: "rgba(245,158,11,0.12)",  activeBorder: "rgba(245,158,11,0.35)" },
  { key: "COMPLETED",   label: "Done",        icon: CheckCircle2, activeColor: "#4ade80",               activeBg: "rgba(74,222,128,0.12)",  activeBorder: "rgba(74,222,128,0.35)" },
]

function TopicRow({ topic, onStatusChange, onDelete, onOpen, loading }: {
  topic: Topic
  onStatusChange: (status: TopicStatus) => void
  onDelete: () => void
  onOpen: () => void
  loading?: boolean
}) {
  // Pick the active status config so we can color the whole row
  const activeStatus = STATUSES.find((s) => s.key === topic.status)!

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      style={{
        display: "flex", alignItems: "center", gap: "0.65rem",
        padding: "0.5rem 0.75rem", borderRadius: 8,
        background: activeStatus.activeBg,
        border: `1px solid ${activeStatus.activeBorder}`,
        transition: "background 0.25s, border-color 0.25s",
      }}
    >
      {/* Topic name — click to open content drawer */}
      <span
        onClick={onOpen}
        style={{
          flex: 1, fontSize: "0.875rem", minWidth: 0,
          textDecoration: topic.status === "COMPLETED" ? "line-through" : "none",
          color: topic.status === "COMPLETED" ? "rgba(255,255,255,0.28)" : "#e2f0ff",
          transition: "color 0.2s, text-decoration 0.2s",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          cursor: "pointer",
        }}
        title="Click to learn this topic"
      >
        {topic.name}
      </span>

      {/* Learn button */}
      <motion.button
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        onClick={onOpen}
        style={{
          background: "rgba(167,139,250,0.1)",
          border: "1px solid rgba(167,139,250,0.25)",
          color: "#a78bfa", borderRadius: 5,
          padding: "0.18rem 0.55rem",
          fontSize: "0.65rem", fontWeight: 600,
          cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", gap: "0.25rem",
        }}
      >
        <BookOpen size={10} /> Learn
      </motion.button>

      {/* 3 status buttons */}
      <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
        {STATUSES.map(({ key, label, icon: Icon, activeColor, activeBg, activeBorder }) => {
          const isActive = topic.status === key
          const isLoading = loading && isActive
          return (
            <motion.button
              key={key}
              onClick={() => !loading && onStatusChange(key)}
              whileHover={!loading && !isActive ? { scale: 1.05 } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
              title={label}
              style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                padding: "0.22rem 0.55rem",
                borderRadius: 20,
                border: `1px solid ${isActive ? activeBorder : "rgba(255,255,255,0.07)"}`,
                background: isActive ? activeBg : "rgba(255,255,255,0.03)",
                color: isActive ? activeColor : "rgba(255,255,255,0.2)",
                fontSize: "0.7rem", fontWeight: isActive ? 600 : 400,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading && !isActive ? 0.4 : 1,
                transition: "all 0.18s",
                whiteSpace: "nowrap",
              }}
            >
              {isLoading
                ? <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />
                : <Icon size={11} />
              }
              {/* Show label only on active to save space */}
              {isActive && <span>{label}</span>}
            </motion.button>
          )
        })}
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.1)", padding: "0.2rem",
          display: "flex", alignItems: "center", flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.1)"}
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ color: color ?? "#00c8ff", fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>{label}</div>
    </div>
  )
}

function ActionBtn({ onClick, loading, label, small }: { onClick: () => void; loading: boolean; label: string; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
        border: "1px solid rgba(0,200,255,0.3)",
        color: "#fff", borderRadius: 6,
        padding: small ? "0 0.75rem" : "0 1rem",
        height: small ? 36 : 42,
        fontSize: small ? "0.78rem" : "0.85rem",
        fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1, whiteSpace: "nowrap",
        transition: "opacity 0.2s",
      }}
    >
      {loading ? "..." : label}
    </button>
  )
}

function CancelBtn({ onClick, small }: { onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.35)", borderRadius: 6,
        padding: small ? "0 0.6rem" : "0 0.75rem",
        height: small ? 36 : 42,
        fontSize: "0.82rem", cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
    >
      ✕
    </button>
  )
}

function LoadingRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {[0.9, 0.7, 0.5].map((opacity, i) => (
        <div key={i} style={{
          borderRadius: 10, overflow: "hidden",
          border: "1px solid rgba(0,200,255,0.06)",
        }}>
          {/* Skill header shimmer */}
          <div style={{
            height: 58, padding: "0 1.1rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
            background: "rgba(0,10,30,0.6)",
          }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: "rgba(0,200,255,0.06)" }} />
            <div style={{ width: 16, height: 16, borderRadius: 3, background: "rgba(0,200,255,0.06)" }} />
            <div style={{
              flex: 1, height: 13, borderRadius: 6,
              background: `rgba(0,200,255,${opacity * 0.06})`,
              maxWidth: `${180 - i * 30}px`,
            }} />
            <div style={{ width: 40, height: 22, borderRadius: 20, background: "rgba(0,200,255,0.05)" }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: "center", padding: "3rem 1rem",
      border: "1px dashed rgba(0,200,255,0.15)", borderRadius: 10,
    }}>
      <BookOpen size={32} color="rgba(0,200,255,0.2)" style={{ margin: "0 auto 0.75rem" }} />
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", margin: "0 0 1rem" }}>
        No skills added yet.
      </p>
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.78rem", margin: 0 }}>
        Click "Add Skill" to get started.
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: "rgba(0,20,50,0.6)",
  border: "1px solid rgba(0,200,255,0.2)",
  borderRadius: 6, height: 42, padding: "0 0.9rem",
  color: "#e2f0ff", fontSize: "0.875rem", outline: "none",
  width: "100%", boxSizing: "border-box",
  transition: "border-color 0.2s",
}
