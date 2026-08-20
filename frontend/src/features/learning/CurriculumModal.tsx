import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, CheckCircle2, Circle, Loader2, Search } from "lucide-react"
import { curriculumService, type CurriculumSummary, type Level } from "./curriculum.service"

// ── Level config ──────────────────────────────────────────────────────────────
const LEVEL_META: Record<Level, { label: string; color: string; bg: string; border: string }> = {
  beginner:     { label: "Beginner",     color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.25)"  },
  intermediate: { label: "Intermediate", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.3)"   },
  advanced:     { label: "Advanced",     color: "#f87171", bg: "rgba(248,113,113,0.08)",   border: "rgba(248,113,113,0.35)" },
}

const CATEGORY_LABELS: Record<string, string> = {
  language: "Language", frontend: "Frontend", backend: "Backend",
  fullstack: "Full Stack", dsa: "DSA", devops: "DevOps",
}

// ── Skill logos from /public/logos/ — keyed by skill name (lowercase) ─────────
const SKILL_LOGOS: Record<string, string> = {
  "javascript":       "/logos/javascript.png",
  "typescript":       "/logos/typescript.png",
  "react":            "/logos/react.png",
  "node.js":          "/logos/nodejs.png",
  "nodejs":           "/logos/nodejs.png",
  "next.js":          "/logos/nextjs-2.svg",
  "nextjs":           "/logos/nextjs-2.svg",
  "github":           "/logos/github.png",
  "git":              "/logos/github.png",
  "git & github":     "/logos/github.png",
  "git and github":   "/logos/github.png",
  "dsa":                              "/logos/dsa.png",
  "data structures":                  "/logos/dsa.png",
  "data structures & algorithms":     "/logos/dsa.png",
  "data structures and algorithms":   "/logos/dsa.png",
  "system design":    "/logos/systemdesign.png",
  "devops":           "/logos/devopss.svg",
  "database":         "/logos/database.svg",
  "sql":              "/logos/database.svg",
  "postgresql":       "/logos/database.svg",
}

// SVGs that are already colored — don't invert them
const SVG_NO_INVERT = new Set(["/logos/database.svg"])

function getSkillLogo(skillName: string): string | null {
  return SKILL_LOGOS[skillName.toLowerCase()] ?? null
}

function needsInvert(src: string): boolean {
  return src.endsWith(".svg") && !SVG_NO_INVERT.has(src)
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function CurriculumModal({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [selectedSkill, setSelectedSkill] = useState<CurriculumSummary | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [filterLevel, setFilterLevel] = useState<Level | "">("")
  const [search, setSearch] = useState("")
  const [success, setSuccess] = useState<string | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: roadmaps = [], isLoading: loadingList } = useQuery({
    queryKey: ["curriculum"],
    queryFn: curriculumService.getAll,
    staleTime: Infinity,   // curriculum never changes at runtime
  })

  const { data: roadmap, isLoading: loadingRoadmap } = useQuery({
    queryKey: ["curriculum", selectedSkill?.skill],
    queryFn: () => curriculumService.getRoadmap(selectedSkill!.skill),
    enabled: !!selectedSkill,
    staleTime: Infinity,
  })

  // ── Import mutation ────────────────────────────────────────────────────────
  const importMutation = useMutation({
    mutationFn: () =>
      curriculumService.import(selectedSkill!.skill, Array.from(selectedTopics)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      queryClient.invalidateQueries({ queryKey: ["topics"] })
      const msg = `${result.imported} topic${result.imported !== 1 ? "s" : ""} added to "${selectedSkill!.skill}"` +
        (result.skipped > 0 ? ` (${result.skipped} already existed)` : "")
      setSuccess(`✅ ${msg}`)
      setSelectedTopics(new Set())
      toast.success("Topics imported!", { description: msg })
    },
    onError: () => toast.error("Failed to import topics"),
  })

  // ── Topic selection helpers ────────────────────────────────────────────────
  function toggleTopic(name: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function selectAllLevel(level: Level) {
    if (!roadmap) return
    const names = roadmap.topics.filter((t) => t.level === level).map((t) => t.name)
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      const allSelected = names.every((n) => next.has(n))
      names.forEach((n) => allSelected ? next.delete(n) : next.add(n))
      return next
    })
  }

  function selectAll() {
    if (!roadmap) return
    const allNames = roadmap.topics.map((t) => t.name)
    const allSelected = allNames.every((n) => selectedTopics.has(n))
    setSelectedTopics(new Set(allSelected ? [] : allNames))
  }

  // ── Filtered topics for roadmap view ──────────────────────────────────────
  const filteredTopics = useMemo(() => {
    if (!roadmap) return []
    return roadmap.topics.filter((t) => {
      if (filterLevel && t.level !== filterLevel) return false
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [roadmap, filterLevel, search])

  // Group by level for display
  const grouped = useMemo(() => {
    const levels: Level[] = ["beginner", "intermediate", "advanced"]
    return levels.map((level) => ({
      level,
      topics: filteredTopics.filter((t) => t.level === level),
    })).filter((g) => g.topics.length > 0)
  }, [filteredTopics])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "100%", maxWidth: 680,
          maxHeight: "88vh",
          background: "rgba(2,12,32,0.98)",
          border: "1px solid rgba(0,200,255,0.2)",
          borderRadius: 14,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.1rem 1.4rem",
          borderBottom: "1px solid rgba(0,200,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {selectedSkill && (
              <button
                onClick={() => { setSelectedSkill(null); setSelectedTopics(new Set()); setSuccess(null); setFilterLevel(""); setSearch("") }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "0.2rem", display: "flex", alignItems: "center" }}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <div style={{ color: "#e2f0ff", fontSize: "1rem", fontWeight: 700 }}>
                {selectedSkill
                  ? `${selectedSkill.icon} ${selectedSkill.skill}`
                  : "📚 Browse Curriculum"
                }
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>
                {selectedSkill
                  ? `Select topics to add to your Learning`
                  : "Pick a skill roadmap to get started"
                }
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "0.25rem", display: "flex", alignItems: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.1rem 1.4rem" }}>

          {/* ── Skill list view ── */}
          {!selectedSkill && (
            loadingList ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: 72, borderRadius: 10 }} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {roadmaps.map((r) => (
                  <motion.button
                    key={r.skill}
                    whileHover={{ x: 4 }}
                    onClick={() => { setSelectedSkill(r); setSuccess(null) }}
                    style={{
                      background: "rgba(0,10,30,0.6)",
                      border: "1px solid rgba(0,200,255,0.1)",
                      borderRadius: 10, padding: "0.85rem 1rem",
                      display: "flex", alignItems: "center", gap: "0.85rem",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,200,255,0.3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,200,255,0.1)")}
                  >
                    {/* Logo image if available, else emoji icon */}
                    {getSkillLogo(r.skill) ? (
                      <div style={{
                        width: 38, height: 38, flexShrink: 0,
                        borderRadius: 8, background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 5,
                      }}>
                        <img
                          src={getSkillLogo(r.skill)!}
                          alt={r.skill}
                          style={{
                            width: "100%", height: "100%", objectFit: "contain",
                            // Black SVGs need invert for dark bg; colored SVGs (database) don't
                            filter: needsInvert(getSkillLogo(r.skill)!) ? "invert(1) brightness(0.85)" : "none",
                          }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: 26, flexShrink: 0 }}>{r.icon}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#e2f0ff", fontSize: "0.9rem", fontWeight: 600 }}>{r.skill}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", marginTop: "0.15rem" }}>{r.description}</div>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>
                          {r.topicCount} topics
                        </span>
                        <span style={{ color: LEVEL_META.beginner.color,     fontSize: "0.65rem" }}>{r.levels.beginner} beginner</span>
                        <span style={{ color: LEVEL_META.intermediate.color, fontSize: "0.65rem" }}>{r.levels.intermediate} intermediate</span>
                        <span style={{ color: LEVEL_META.advanced.color,     fontSize: "0.65rem" }}>{r.levels.advanced} advanced</span>
                        <span style={{
                          color: "#00c8ff", fontSize: "0.63rem",
                          background: "rgba(0,200,255,0.07)",
                          border: "1px solid rgba(0,200,255,0.15)",
                          borderRadius: 4, padding: "0.05rem 0.35rem",
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>
                          {CATEGORY_LABELS[r.category]}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </motion.button>
                ))}
              </div>
            )
          )}

          {/* ── Roadmap topic view ── */}
          {selectedSkill && (
            loadingRoadmap ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: 42, borderRadius: 8 }} />
                ))}
              </div>
            ) : (
              <div>
                {/* Success banner */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{
                        background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                        borderRadius: 8, padding: "0.65rem 0.9rem",
                        color: "#4ade80", fontSize: "0.82rem", marginBottom: "1rem",
                      }}
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Controls row */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem", flexWrap: "wrap", alignItems: "center" }}>
                  {/* Search */}
                  <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                    <Search size={13} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      placeholder="Search topics..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        width: "100%", background: "rgba(0,20,50,0.6)",
                        border: "1px solid rgba(0,200,255,0.15)", borderRadius: 6,
                        height: 34, paddingLeft: 30, paddingRight: 10,
                        color: "#e2f0ff", fontSize: "0.78rem", outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Level filter pills */}
                  {(["", "beginner", "intermediate", "advanced"] as (Level | "")[]).map((l) => (
                    <button key={l} onClick={() => setFilterLevel(l)}
                      style={{
                        padding: "0.25rem 0.7rem", borderRadius: 20, fontSize: "0.7rem",
                        border: `1px solid ${filterLevel === l
                          ? l ? LEVEL_META[l].border : "rgba(0,200,255,0.35)"
                          : "rgba(255,255,255,0.07)"}`,
                        background: filterLevel === l
                          ? l ? LEVEL_META[l].bg : "rgba(0,200,255,0.08)"
                          : "rgba(255,255,255,0.02)",
                        color: filterLevel === l
                          ? l ? LEVEL_META[l].color : "#00c8ff"
                          : "rgba(255,255,255,0.3)",
                        cursor: "pointer", fontWeight: filterLevel === l ? 600 : 400,
                        transition: "all 0.15s",
                      }}
                    >
                      {l === "" ? "All" : LEVEL_META[l].label}
                    </button>
                  ))}

                  {/* Select All */}
                  <button onClick={selectAll}
                    style={{
                      padding: "0.25rem 0.7rem", borderRadius: 20, fontSize: "0.7rem",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {roadmap && roadmap.topics.every((t) => selectedTopics.has(t.name)) ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Topics grouped by level */}
                {grouped.map(({ level, topics }) => (
                  <div key={level} style={{ marginBottom: "1.1rem" }}>
                    {/* Level header */}
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        marginBottom: "0.5rem", cursor: "pointer",
                      }}
                      onClick={() => selectAllLevel(level)}
                    >
                      <span style={{
                        color: LEVEL_META[level].color, fontSize: "0.7rem", fontWeight: 700,
                        background: LEVEL_META[level].bg, border: `1px solid ${LEVEL_META[level].border}`,
                        borderRadius: 4, padding: "0.15rem 0.5rem",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        {LEVEL_META[level].label}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem" }}>
                        {topics.filter((t) => selectedTopics.has(t.name)).length}/{topics.length} selected · click to toggle all
                      </span>
                    </div>

                    {/* Topic checkboxes */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {topics.map((topic) => {
                        const isSelected = selectedTopics.has(topic.name)
                        return (
                          <motion.div
                            key={topic.name}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleTopic(topic.name)}
                            style={{
                              display: "flex", alignItems: "center", gap: "0.65rem",
                              padding: "0.5rem 0.75rem",
                              background: isSelected ? `${LEVEL_META[level].bg}` : "rgba(255,255,255,0.02)",
                              border: `1px solid ${isSelected ? LEVEL_META[level].border : "rgba(255,255,255,0.04)"}`,
                              borderRadius: 7, cursor: "pointer",
                              transition: "background 0.15s, border-color 0.15s",
                            }}
                          >
                            {isSelected
                              ? <CheckCircle2 size={15} color={LEVEL_META[level].color} />
                              : <Circle size={15} color="rgba(255,255,255,0.2)" />
                            }
                            <span style={{
                              color: isSelected ? "#e2f0ff" : "rgba(255,255,255,0.55)",
                              fontSize: "0.82rem",
                              fontWeight: isSelected ? 500 : 400,
                              transition: "color 0.15s",
                            }}>
                              {topic.name}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer — import button (only in roadmap view) */}
        {selectedSkill && (
          <div style={{
            padding: "0.9rem 1.4rem",
            borderTop: "1px solid rgba(0,200,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0, gap: "0.75rem",
          }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
              {selectedTopics.size > 0
                ? `${selectedTopics.size} topic${selectedTopics.size > 1 ? "s" : ""} selected`
                : "Select topics to import"
              }
            </span>
            <motion.button
              whileHover={selectedTopics.size > 0 ? { scale: 1.04 } : {}}
              whileTap={selectedTopics.size > 0 ? { scale: 0.96 } : {}}
              onClick={() => selectedTopics.size > 0 && importMutation.mutate()}
              disabled={selectedTopics.size === 0 || importMutation.isPending}
              style={{
                background: selectedTopics.size > 0
                  ? "linear-gradient(90deg, #0369a1, #0ea5e9)"
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${selectedTopics.size > 0 ? "rgba(0,200,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: selectedTopics.size > 0 ? "#fff" : "rgba(255,255,255,0.25)",
                borderRadius: 8, padding: "0.5rem 1.3rem",
                fontSize: "0.85rem", fontWeight: 600,
                cursor: selectedTopics.size > 0 && !importMutation.isPending ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: "0.4rem",
                transition: "all 0.15s",
              }}
            >
              {importMutation.isPending && <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />}
              {importMutation.isPending ? "Importing..." : `Import ${selectedTopics.size > 0 ? selectedTopics.size : ""} Topics`}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
