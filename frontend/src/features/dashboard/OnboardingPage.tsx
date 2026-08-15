import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { careerGoalService, skillService, topicService } from "../learning/learning.service"
import type { Skill } from "../learning/learning.service"
import AnimatedBg from "@/components/AnimatedBg"
import { useAuthStore } from "../auth/auth.store"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate()
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding)
  const [step, setStep] = useState<Step>(1)

  // Step 1 state
  const [goalTitle, setGoalTitle] = useState("")
  const [goalDesc, setGoalDesc] = useState("")
  const [goalLoading, setGoalLoading] = useState(false)
  const [goalError, setGoalError] = useState("")

  // Step 2 state
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [skillLoading, setSkillLoading] = useState(false)
  const [skillError, setSkillError] = useState("")

  // Step 3 state — key = skillId, value = array of topic names added so far
  const [topicInputs, setTopicInputs] = useState<Record<string, string>>({})
  const [topics, setTopics] = useState<Record<string, string[]>>({})
  const [topicLoading, setTopicLoading] = useState(false)

  // ── Step 1: Save career goal ───────────────────────────────────────────────

  async function handleGoalSubmit() {
    if (!goalTitle.trim()) {
      setGoalError("Please enter your career goal")
      return
    }
    setGoalError("")
    setGoalLoading(true)
    try {
      await careerGoalService.upsert({
        title: goalTitle.trim(),
        description: goalDesc.trim() || undefined,
      })
      setStep(2)
    } catch {
      setGoalError("Failed to save. Please try again.")
    } finally {
      setGoalLoading(false)
    }
  }

  // ── Step 2: Add skills ────────────────────────────────────────────────────

  async function addSkill() {
    if (!skillInput.trim()) return
    setSkillError("")
    setSkillLoading(true)
    try {
      const skill = await skillService.create(skillInput.trim())
      setSkills((prev) => [...prev, skill])
      setSkillInput("")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSkillError(msg ?? "Failed to add skill")
    } finally {
      setSkillLoading(false)
    }
  }

  async function removeSkill(id: string) {
    await skillService.delete(id)
    setSkills((prev) => prev.filter((s) => s.id !== id))
    // Remove that skill's topics from local state too
    setTopics((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  // ── Step 3: Add topics per skill ──────────────────────────────────────────

  async function addTopic(skillId: string) {
    const name = topicInputs[skillId]?.trim()
    if (!name) return
    setTopicLoading(true)
    try {
      await topicService.create(skillId, name)
      setTopics((prev) => ({
        ...prev,
        [skillId]: [...(prev[skillId] ?? []), name],
      }))
      setTopicInputs((prev) => ({ ...prev, [skillId]: "" }))
    } catch {
      // silently ignore duplicate topic errors
    } finally {
      setTopicLoading(false)
    }
  }

  function handleTopicKey(e: React.KeyboardEvent, skillId: string) {
    if (e.key === "Enter") { e.preventDefault(); addTopic(skillId) }
  }

  // ── Finish onboarding ──────────────────────────────────────────────────────

  function finish() {
    completeOnboarding()  // clear the onboardingPending flag
    navigate("/dashboard", { replace: true })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", overflow: "hidden",
      backgroundImage: "url('/developer os bg image.png')",
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "rgba(0,4,15,0.7)" }} />
      <AnimatedBg />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative", zIndex: 2,
          width: "100%", maxWidth: 520,
          background: "rgba(0,10,30,0.75)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,200,255,0.2)",
          borderRadius: 4, padding: "2.5rem",
          boxShadow: "0 0 0 1px rgba(0,200,255,0.06), 0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.7), transparent)",
          borderRadius: "4px 4px 0 0",
        }} />

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 4,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              border: "1px solid rgba(0,200,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace",
              boxShadow: "0 0 10px rgba(0,200,255,0.3)",
            }}>D</div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.04em", fontFamily: "monospace" }}>
              DEVELOPER<span style={{ color: "#00c8ff" }}>OS</span>
            </span>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {([1, 2, 3] as Step[]).map((s) => (
              <div key={s} style={{
                height: 3, flex: 1, borderRadius: 2,
                background: s <= step ? "rgba(0,200,255,0.8)" : "rgba(0,200,255,0.15)",
                transition: "background 0.4s",
              }} />
            ))}
          </div>

          <div style={{ color: "rgba(0,200,255,0.5)", fontSize: "0.7rem", letterSpacing: "0.15em", fontFamily: "monospace", marginBottom: "0.3rem" }}>
            STEP {step} OF 3
          </div>
          <h2 style={{ color: "#e2f0ff", fontSize: "1.4rem", fontWeight: 700, margin: 0, fontFamily: "monospace", letterSpacing: "0.02em" }}>
            {step === 1 && "SET YOUR GOAL"}
            {step === 2 && "ADD YOUR SKILLS"}
            {step === 3 && "ADD TOPICS"}
          </h2>
          <p style={{ color: "rgba(0,200,255,0.45)", fontSize: "0.78rem", margin: "0.3rem 0 0", fontFamily: "monospace", letterSpacing: "0.05em" }}>
            {step === 1 && "WHAT DO YOU WANT TO BECOME?"}
            {step === 2 && "WHAT TECHNOLOGIES ARE YOU LEARNING?"}
            {step === 3 && "ADD SPECIFIC TOPICS FOR EACH SKILL"}
          </p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepOne
              key="step1"
              goalTitle={goalTitle} setGoalTitle={setGoalTitle}
              goalDesc={goalDesc} setGoalDesc={setGoalDesc}
              goalError={goalError} goalLoading={goalLoading}
              onNext={handleGoalSubmit}
            />
          )}
          {step === 2 && (
            <StepTwo
              key="step2"
              skills={skills}
              skillInput={skillInput} setSkillInput={setSkillInput}
              skillError={skillError} skillLoading={skillLoading}
              onAdd={addSkill} onRemove={removeSkill}
              onNext={() => skills.length > 0 ? setStep(3) : setSkillError("Add at least one skill to continue")}
              onSkip={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepThree
              key="step3"
              skills={skills}
              topics={topics}
              topicInputs={topicInputs}
              setTopicInputs={setTopicInputs}
              topicLoading={topicLoading}
              onAdd={addTopic}
              onKey={handleTopicKey}
              onFinish={finish}
            />
          )}
        </AnimatePresence>

        {/* Bottom bar */}
        <div style={{
          marginTop: "1.75rem", paddingTop: "0.75rem",
          borderTop: "1px solid rgba(0,200,255,0.1)",
          display: "flex", justifyContent: "space-between",
          fontSize: "0.68rem", fontFamily: "monospace",
          color: "rgba(0,200,255,0.3)", letterSpacing: "0.08em",
        }}>
          <span>ONBOARDING SEQUENCE</span>
          <span style={{ color: "rgba(0,255,128,0.5)" }}>● ACTIVE</span>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Step 1 — Career Goal ────────────────────────────────────────────────────

function StepOne({ goalTitle, setGoalTitle, goalDesc, setGoalDesc, goalError, goalLoading, onNext }: {
  goalTitle: string; setGoalTitle: (v: string) => void
  goalDesc: string; setGoalDesc: (v: string) => void
  goalError: string; goalLoading: boolean; onNext: () => void
}) {
  const goals = ["Frontend Developer", "Full Stack Developer", "Backend Developer", "React Developer", "Node.js Developer"]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Quick select */}
      <div>
        <div style={{ color: "rgba(0,200,255,0.5)", fontSize: "0.7rem", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
          QUICK SELECT
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {goals.map((g) => (
            <button key={g} onClick={() => setGoalTitle(g)} style={{
              background: goalTitle === g ? "rgba(0,200,255,0.15)" : "rgba(0,20,50,0.5)",
              border: `1px solid ${goalTitle === g ? "rgba(0,200,255,0.6)" : "rgba(0,200,255,0.15)"}`,
              color: goalTitle === g ? "#00c8ff" : "rgba(255,255,255,0.5)",
              borderRadius: 3, padding: "0.35rem 0.75rem",
              fontSize: "0.78rem", fontFamily: "monospace",
              cursor: "pointer", transition: "all 0.2s",
            }}>{g}</button>
          ))}
        </div>
      </div>

      <CyberInput label="CAREER GOAL" placeholder="e.g. Frontend Developer" value={goalTitle} onChange={setGoalTitle} />
      <CyberInput label="DESCRIPTION (OPTIONAL)" placeholder="e.g. Get a job at a product company" value={goalDesc} onChange={setGoalDesc} />

      {goalError && <span style={{ color: "#fca5a5", fontSize: "0.78rem", fontFamily: "monospace" }}>▸ {goalError}</span>}

      <CyberButton onClick={onNext} disabled={goalLoading}>
        {goalLoading ? "SAVING..." : "NEXT: ADD SKILLS →"}
      </CyberButton>
    </motion.div>
  )
}

// ─── Step 2 — Skills ─────────────────────────────────────────────────────────

function StepTwo({ skills, skillInput, setSkillInput, skillError, skillLoading, onAdd, onRemove, onNext, onSkip }: {
  skills: Skill[]; skillInput: string; setSkillInput: (v: string) => void
  skillError: string; skillLoading: boolean
  onAdd: () => void; onRemove: (id: string) => void
  onNext: () => void; onSkip: () => void
}) {
  const suggestions = ["JavaScript", "TypeScript", "React", "Node.js", "CSS", "Git", "SQL"]

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); onAdd() }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Suggestions */}
      <div>
        <div style={{ color: "rgba(0,200,255,0.5)", fontSize: "0.7rem", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
          SUGGESTIONS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {suggestions.filter((s) => !skills.find((sk) => sk.name === s)).map((s) => (
            <button key={s} onClick={() => setSkillInput(s)} style={{
              background: "rgba(0,20,50,0.5)",
              border: "1px solid rgba(0,200,255,0.15)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 3, padding: "0.35rem 0.75rem",
              fontSize: "0.78rem", fontFamily: "monospace",
              cursor: "pointer", transition: "all 0.2s",
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <div style={{ flex: 1 }}>
          <CyberInput
            label="SKILL NAME" placeholder="e.g. JavaScript"
            value={skillInput} onChange={setSkillInput} onKeyDown={handleKey}
          />
        </div>
        <button onClick={onAdd} disabled={skillLoading} style={{
          background: "rgba(0,200,255,0.12)", border: "1px solid rgba(0,200,255,0.3)",
          color: "#00c8ff", borderRadius: 3, padding: "0 1rem",
          fontFamily: "monospace", fontSize: "0.8rem", cursor: "pointer",
          marginTop: "1.4rem", alignSelf: "flex-start", height: 42,
          transition: "all 0.2s",
        }}>+ ADD</button>
      </div>

      {skillError && <span style={{ color: "#fca5a5", fontSize: "0.78rem", fontFamily: "monospace" }}>▸ {skillError}</span>}

      {/* Added skills */}
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {skills.map((s) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.3)",
              borderRadius: 3, padding: "0.3rem 0.7rem",
              color: "#00c8ff", fontSize: "0.8rem", fontFamily: "monospace",
            }}>
              {s.name}
              <button onClick={() => onRemove(s.id)} style={{
                background: "none", border: "none", color: "rgba(0,200,255,0.5)",
                cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0,
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      <CyberButton onClick={onNext} disabled={skillLoading}>
        {skillLoading ? "ADDING..." : "NEXT: ADD TOPICS →"}
      </CyberButton>

      <button onClick={onSkip} style={{
        background: "none", border: "none", color: "rgba(0,200,255,0.3)",
        fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer",
        letterSpacing: "0.1em", textAlign: "center",
      }}>
        SKIP FOR NOW
      </button>
    </motion.div>
  )
}

// ─── Step 3 — Topics ─────────────────────────────────────────────────────────

function StepThree({ skills, topics, topicInputs, setTopicInputs, topicLoading, onAdd, onKey, onFinish }: {
  skills: Skill[]
  topics: Record<string, string[]>
  topicInputs: Record<string, string>
  setTopicInputs: (fn: (prev: Record<string, string>) => Record<string, string>) => void
  topicLoading: boolean
  onAdd: (skillId: string) => void
  onKey: (e: React.KeyboardEvent, skillId: string) => void
  onFinish: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {skills.length === 0 ? (
        <p style={{ color: "rgba(0,200,255,0.4)", fontFamily: "monospace", fontSize: "0.85rem" }}>
          No skills added — you can add topics later from the dashboard.
        </p>
      ) : (
        skills.map((skill) => (
          <div key={skill.id}>
            <div style={{ color: "#00c8ff", fontSize: "0.78rem", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
              {skill.name.toUpperCase()}
            </div>

            {/* Added topics */}
            {(topics[skill.id] ?? []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {(topics[skill.id] ?? []).map((t) => (
                  <span key={t} style={{
                    background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)",
                    color: "rgba(0,200,255,0.7)", borderRadius: 3,
                    padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontFamily: "monospace",
                  }}>{t}</span>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder={`e.g. Closures, Promises...`}
                value={topicInputs[skill.id] ?? ""}
                onChange={(e) => setTopicInputs((prev) => ({ ...prev, [skill.id]: e.target.value }))}
                onKeyDown={(e) => onKey(e, skill.id)}
                style={{
                  flex: 1, background: "rgba(0,20,50,0.6)",
                  border: "1px solid rgba(0,200,255,0.2)", borderRadius: 3,
                  height: 38, padding: "0 0.8rem", color: "#e2f0ff",
                  fontSize: "0.85rem", fontFamily: "monospace", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0,200,255,0.6)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(0,200,255,0.2)"}
              />
              <button onClick={() => onAdd(skill.id)} disabled={topicLoading} style={{
                background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.25)",
                color: "#00c8ff", borderRadius: 3, padding: "0 0.9rem",
                fontFamily: "monospace", fontSize: "0.78rem", cursor: "pointer",
                height: 38, transition: "all 0.2s",
              }}>+ ADD</button>
            </div>
          </div>
        ))
      )}

      <CyberButton onClick={onFinish}>
        LAUNCH DASHBOARD →
      </CyberButton>
    </motion.div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function CyberInput({ label, placeholder, value, onChange, onKeyDown }: {
  label: string; placeholder: string; value: string
  onChange: (v: string) => void; onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ color: "rgba(0,200,255,0.6)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em", fontFamily: "monospace" }}>
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,200,255,0.2)",
          borderRadius: 3, height: 42, padding: "0 0.9rem",
          color: "#e2f0ff", fontSize: "0.88rem", outline: "none",
          width: "100%", boxSizing: "border-box" as const,
          fontFamily: "monospace", transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,200,255,0.7)"
          e.currentTarget.style.boxShadow = "0 0 10px rgba(0,200,255,0.12)"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,200,255,0.2)"
          e.currentTarget.style.boxShadow = "none"
        }}
      />
    </div>
  )
}

function CyberButton({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02, boxShadow: disabled ? undefined : "0 0 20px rgba(0,200,255,0.35)" }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      style={{
        background: "linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%)",
        border: "1px solid rgba(0,200,255,0.4)",
        color: "#fff", fontWeight: 700,
        borderRadius: 3, height: 44, width: "100%",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontSize: "0.82rem", letterSpacing: "0.15em",
        fontFamily: "monospace", transition: "opacity 0.2s",
      }}
    >
      {children}
    </motion.button>
  )
}
