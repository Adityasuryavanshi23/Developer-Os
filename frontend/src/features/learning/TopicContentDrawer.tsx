import { useState, useRef, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import {
  X, BookOpen, Code2, MessageSquare, ExternalLink,
  RefreshCw, Loader2, CheckCircle2, Globe, ServerCrash, WifiOff,
  Bookmark, BookmarkCheck, Trash2, ChevronLeft, Send, Sparkles, ChevronDown,
} from "lucide-react"
import { topicContentService, type Language, type TopicContent, type SavedTopicContent, type YoutubeVideo } from "./topicContent.service"
import { topicService, type Topic } from "./learning.service"
import CodeBlock from "../../components/ui/CodeBlock"

const LANGS: { key: Language; label: string; flag: string }[] = [
  { key: "en", label: "English",  flag: "🇬🇧" },
  { key: "hl", label: "Hinglish", flag: "🇮🇳" },
  { key: "hi", label: "Hindi",    flag: "🇮🇳" },
]

interface Props {
  topic: Topic
  skillName: string
  open: boolean
  onClose: () => void
  onStatusChange: (status: Topic["status"]) => void
}

type ActiveTab = "learn" | "code" | "interview"

export default function TopicContentDrawer({ topic, skillName, open, onClose, onStatusChange }: Props) {
  const queryClient = useQueryClient()
  const [lang, setLang] = useState<Language>("en")
  const [activeTab, setActiveTab] = useState<ActiveTab>("learn")
  const [savePopup, setSavePopup] = useState(false)
  const [saveTitle, setSaveTitle] = useState("")
  const [showSaved, setShowSaved] = useState(false)
  const [loadedSaved, setLoadedSaved] = useState<SavedTopicContent | null>(null)
  const [askQuestion, setAskQuestion] = useState("")
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  const [askLoading, setAskLoading] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)
  const [askFocused, setAskFocused] = useState(false)
  const [inputHovered, setInputHovered] = useState(false)
  const askInputRef = useRef<HTMLInputElement>(null)
  const scrollBodyRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollBodyRef.current
    if (!el) return
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 20)
  }, [])

  useEffect(() => {
    const el = scrollBodyRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll)
    return () => el.removeEventListener("scroll", checkScroll)
  }, [checkScroll])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["topic-content", topic.id],
    queryFn: () => topicContentService.get(topic.id),
    staleTime: Infinity, retry: 1, enabled: open,
  })

  const { data: savedList = [] } = useQuery({
    queryKey: ["topic-content-saved", topic.id],
    queryFn: () => topicContentService.getSaved(topic.id),
    staleTime: 0, enabled: open,
  })

  const saveMutation = useMutation({
    mutationFn: ({ title, content }: { title: string; content: TopicContent }) =>
      topicContentService.save(topic.id, title, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-content-saved", topic.id] })
      setSavePopup(false); setSaveTitle("")
    },
  })

  const deleteSavedMutation = useMutation({
    mutationFn: (savedId: string) => topicContentService.deleteSaved(topic.id, savedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-content-saved", topic.id] })
      if (loadedSaved) setLoadedSaved(null)
    },
  })

  const regenerate = useMutation({
    mutationFn: () => topicContentService.clearCache(topic.id),
    onSuccess: () => {
      setLoadedSaved(null)
      queryClient.removeQueries({ queryKey: ["topic-content", topic.id] })
      refetch()
    },
  })

  const markDone = useMutation({
    mutationFn: () => topicService.update(topic.id, { status: "COMPLETED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] })
      onStatusChange("COMPLETED")
    },
  })

  // Re-check scroll when content changes (after data is defined)
  useEffect(() => { checkScroll() }, [data, loadedSaved, checkScroll])

  const activeContent: TopicContent | null = loadedSaved
    ? (loadedSaved.content as TopicContent)
    : (data?.data ?? null)

  const explanation = activeContent
    ? lang === "en" ? activeContent.explanationEn
      : lang === "hi" ? activeContent.explanationHi
      : activeContent.explanationHl
    : null

  const isDone = topic.status === "COMPLETED"
  const colCount = activeTab === "learn" ? 1 : activeTab === "code" ? 2 : 3

  async function handleAsk() {
    if (!askQuestion.trim() || askLoading) return
    setAskLoading(true); setAskError(null); setAskAnswer(null)
    try {
      const answer = await topicContentService.ask(topic.id, askQuestion.trim())
      setAskAnswer(answer)
    } catch {
      setAskError("Failed to get answer. Try again.")
    } finally {
      setAskLoading(false)
    }
  }

  function openSavePopup() {
    setSaveTitle(activeContent?.suggestedTitle ?? topic.name)
    setSavePopup(true)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 38, mass: 0.8 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col"
            style={{
              height: "92vh",
              background: "#020c1b",
              borderTop: "1px solid rgba(0,200,255,0.18)",
              borderRadius: "18px 18px 0 0",
              boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* ── Header ── */}
            <div
              className="flex-shrink-0 px-6 pt-2 pb-3"
              style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}
            >
              {/* Row 1: badges + actions + close */}
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ color: "#00c8ff", background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)" }}>
                    {skillName}
                  </span>
                  {isDone && (
                    <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                      style={{ color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}>
                      <CheckCircle2 size={10} /> Done
                    </span>
                  )}
                  {loadedSaved && (
                    <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                      style={{ color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)" }}>
                      <BookmarkCheck size={10} /> {loadedSaved.title}
                    </span>
                  )}
                  {savedList.length > 0 && (
                    <button onClick={() => setShowSaved(true)}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded cursor-pointer"
                      style={{ color: "#a78bfa", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                      <Bookmark size={9} /> {savedList.length} Saved
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {!loadedSaved && (
                    <>
                      <button onClick={() => regenerate.mutate()} disabled={regenerate.isPending}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-all"
                        style={{
                          background: regenerate.isPending ? "rgba(0,200,255,0.06)" : "none",
                          border: "1px solid rgba(0,200,255,0.15)",
                          color: regenerate.isPending ? "#00c8ff" : "rgba(255,255,255,0.4)",
                          cursor: regenerate.isPending ? "not-allowed" : "pointer",
                        }}
                        onMouseEnter={(e) => { if (!regenerate.isPending) { e.currentTarget.style.background = "rgba(0,200,255,0.08)"; e.currentTarget.style.color = "#00c8ff" } }}
                        onMouseLeave={(e) => { if (!regenerate.isPending) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.4)" } }}
                      >
                        {regenerate.isPending ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <RefreshCw size={12} />}
                        {regenerate.isPending ? "Regenerating..." : "Regenerate"}
                      </button>
                      <button onClick={openSavePopup} disabled={savedList.length >= 10}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded"
                        style={{
                          background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)",
                          color: savedList.length >= 10 ? "rgba(167,139,250,0.3)" : "#a78bfa",
                          cursor: savedList.length >= 10 ? "not-allowed" : "pointer",
                        }}>
                        <Bookmark size={12} /> Save
                      </button>
                    </>
                  )}
                  {loadedSaved && (
                    <button onClick={() => setLoadedSaved(null)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded"
                      style={{ background: "none", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", cursor: "pointer" }}>
                      <ChevronLeft size={12} /> Back to AI
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.12)"; e.currentTarget.style.color = "#f87171" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)" }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-bold mb-3 leading-snug" style={{ color: "#e2f0ff", fontSize: "1.15rem" }}>
                {topic.name}
              </h2>

              {/* Lang + Tabs + Mark Done */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Language toggles */}
                <div className="flex gap-1.5">
                  {LANGS.map((l) => (
                    <button key={l.key} onClick={() => setLang(l.key)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-all"
                      style={{
                        border: `1px solid ${lang === l.key ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.08)"}`,
                        background: lang === l.key ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.02)",
                        color: lang === l.key ? "#a78bfa" : "rgba(255,255,255,0.35)",
                        fontWeight: lang === l.key ? 600 : 400, cursor: "pointer",
                      }}>
                      <Globe size={9} /> {l.flag} {l.label}
                    </button>
                  ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1">
                  {([
                    { key: "learn" as ActiveTab,     label: "Learn",     icon: BookOpen,      cols: "1 col" },
                    { key: "code" as ActiveTab,      label: "Code",      icon: Code2,         cols: "2 col" },
                    { key: "interview" as ActiveTab, label: "Interview", icon: MessageSquare, cols: "3 col" },
                  ]).map(({ key, label, icon: Icon, cols }) => {
                    const isActive = activeTab === key
                    return (
                      <button key={key} onClick={() => setActiveTab(key)}
                        className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: isActive ? "rgba(0,200,255,0.1)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isActive ? "rgba(0,200,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                          color: isActive ? "#00c8ff" : "rgba(255,255,255,0.4)",
                          fontWeight: isActive ? 600 : 400, cursor: "pointer",
                        }}>
                        <Icon size={13} /> {label}
                        {isActive && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                            style={{ background: "rgba(0,200,255,0.15)", color: "rgba(0,200,255,0.8)" }}>
                            {cols}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Mark Done */}
                {!isDone ? (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => markDone.mutate()} disabled={markDone.isPending}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold ml-auto"
                    style={{ background: "linear-gradient(90deg, #16a34a, #4ade80)", border: "1px solid rgba(74,222,128,0.4)", color: "#fff", cursor: "pointer" }}>
                    {markDone.isPending ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <CheckCircle2 size={14} />}
                    Mark as Done
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-semibold ml-auto" style={{ color: "#4ade80" }}>
                    <CheckCircle2 size={14} /> Completed!
                  </div>
                )}
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div ref={scrollBodyRef} className="flex-1 overflow-y-auto" style={{ padding: "1.5rem 1.5rem 9rem" }}>

              {/* Loading */}
              {isLoading && !loadedSaved && (
                <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: 200 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                    <Loader2 size={32} color="rgba(0,200,255,0.5)" />
                  </motion.div>
                  <div className="text-center" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
                    <div>Generating content with AI...</div>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", marginTop: "0.3rem" }}>First time takes 3-5 seconds, then instant!</div>
                  </div>
                </div>
              )}

              {/* Error */}
              {isError && !isLoading && !loadedSaved && (
                <ErrorState error={error} onRetry={() => refetch()} />
              )}

              {/* Content — split columns */}
              {activeContent && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeTab}-${lang}-${loadedSaved?.id ?? "fresh"}`}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={`grid gap-6 ${colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"}`}>

                      {/* Col 1: Learn */}
                      <div className={`flex flex-col gap-4 ${colCount > 1 ? "lg:border-r lg:pr-6" : ""}`}
                        style={{ borderColor: "rgba(0,200,255,0.08)" }}>
                        {colCount > 1 && (
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "rgba(0,200,255,0.5)" }}>
                            <BookOpen size={12} /> Learn
                          </div>
                        )}
                        <div style={{
                          color: "rgba(255,255,255,0.82)", fontSize: colCount > 1 ? "0.85rem" : "0.93rem",
                          lineHeight: 1.9, whiteSpace: "pre-wrap",
                          fontFamily: lang === "hi" ? "'Noto Sans Devanagari', sans-serif" : "inherit",
                        }}>
                          {explanation}
                        </div>
                        {colCount === 1 && (
                          <ResourcesList
                            resources={activeContent.resources as { title: string; url: string }[]}
                            youtubeVideos={activeContent.youtubeVideos as YoutubeVideo[]}
                          />
                        )}
                      </div>

                      {/* Col 2: Code */}
                      {colCount >= 2 && (
                        <div className={`flex flex-col gap-4 ${colCount > 2 ? "lg:border-r lg:pr-6" : ""}`}
                          style={{ borderColor: "rgba(0,200,255,0.08)" }}>
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "rgba(0,200,255,0.5)" }}>
                            <Code2 size={12} /> Code
                          </div>
                          {activeContent.codeExample ? (
                            <CodeBlock
                              code={activeContent.codeExample}
                              fontSize={colCount > 2 ? "0.75rem" : "0.8rem"}
                            />
                          ) : (
                            <div className="text-center py-8 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                              No code example for this topic.
                            </div>
                          )}
                          {colCount === 2 && (
                            <ResourcesList
                              resources={activeContent.resources as { title: string; url: string }[]}
                              youtubeVideos={activeContent.youtubeVideos as YoutubeVideo[]}
                            />
                          )}
                        </div>
                      )}

                      {/* Col 3: Interview */}
                      {colCount >= 3 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "rgba(0,200,255,0.5)" }}>
                            <MessageSquare size={12} /> Interview
                          </div>
                          {(activeContent.interviewQs as string[]).map((q, i) => (
                            <div key={i} style={{
                              background: "rgba(0,10,30,0.7)", border: "1px solid rgba(0,200,255,0.1)",
                              borderLeft: "3px solid #00c8ff", borderRadius: 8, padding: "0.75rem 1rem",
                            }}>
                              <div className="text-[10px] font-bold mb-1.5" style={{ color: "rgba(0,200,255,0.5)" }}>Q{i + 1}</div>
                              <div style={{ color: "#e2f0ff", fontSize: "0.85rem", lineHeight: 1.65 }}>{q}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* ── Ask AI — fixed at bottom ── */}
            <div
              className="absolute bottom-0 inset-x-0 flex-shrink-0"
              style={{
                background: "linear-gradient(to bottom, transparent 0%, #020c1b 18%)",
                zIndex: 10,
              }}
            >
              {/* Scroll hint — only when content below */}
              <AnimatePresence>
                {canScrollDown && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex justify-center pb-1 pt-2 pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      style={{ color: "rgba(0,200,255,0.35)" }}
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Ask AI panel */}
              <div
                className="mx-4 mb-4 rounded-xl overflow-hidden"
                style={{
                  border: askFocused
                    ? "1px solid rgba(0,200,255,0.55)"
                    : inputHovered
                    ? "1px solid rgba(0,200,255,0.3)"
                    : "1px solid rgba(0,200,255,0.18)",
                  background: askFocused
                    ? "rgba(0,200,255,0.05)"
                    : "rgba(0,10,25,0.85)",
                  boxShadow: askFocused
                    ? "0 0 0 3px rgba(0,200,255,0.1), 0 -8px 32px rgba(0,0,0,0.4)"
                    : "0 -8px 32px rgba(0,0,0,0.4)",
                  transition: "border 0.2s, box-shadow 0.2s, background 0.2s",
                }}
                onMouseEnter={() => setInputHovered(true)}
                onMouseLeave={() => setInputHovered(false)}
              >
                {/* Label row */}
                <div
                  className="flex items-center gap-1.5 px-4 pt-2.5 pb-1"
                  style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}
                >
                  <Sparkles size={11} style={{ color: "#00c8ff" }} />
                  <span style={{ color: "#00c8ff", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Ask AI
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem", marginLeft: 2 }}>
                    · about {topic.name}
                  </span>
                </div>

                {/* AI answer bubble */}
                <AnimatePresence>
                  {(askAnswer || askError) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pt-3 pb-1 text-sm leading-relaxed"
                      style={{
                        background: askError ? "rgba(248,113,113,0.04)" : "transparent",
                        borderBottom: "1px solid rgba(0,200,255,0.07)",
                        color: askError ? "#f87171" : "rgba(255,255,255,0.82)",
                        whiteSpace: "pre-wrap", maxHeight: 150, overflowY: "auto",
                        fontSize: "0.82rem",
                      }}
                    >
                      {askError ?? askAnswer}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input row */}
                <div className="flex gap-2 items-center px-3 py-2.5">
                  <input
                    ref={askInputRef}
                    value={askQuestion}
                    onChange={(e) => setAskQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAsk() }}
                    onFocus={() => setAskFocused(true)}
                    onBlur={() => setAskFocused(false)}
                    placeholder="Type your question and press Enter..."
                    disabled={askLoading}
                    className="flex-1 text-sm outline-none"
                    style={{
                      background: "transparent", border: "none",
                      color: "#e2f0ff", caretColor: "#00c8ff",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!askQuestion.trim() || askLoading}
                    className="flex items-center justify-center rounded-lg transition-all flex-shrink-0"
                    style={{
                      width: 32, height: 32,
                      background: askQuestion.trim() && !askLoading
                        ? "linear-gradient(135deg, rgba(0,200,255,0.25), rgba(0,200,255,0.12))"
                        : "rgba(0,200,255,0.04)",
                      border: `1px solid ${askQuestion.trim() && !askLoading ? "rgba(0,200,255,0.4)" : "rgba(0,200,255,0.12)"}`,
                      color: askQuestion.trim() && !askLoading ? "#00c8ff" : "rgba(0,200,255,0.25)",
                      cursor: !askQuestion.trim() || askLoading ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!askLoading && askQuestion.trim()) {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,200,255,0.35), rgba(0,200,255,0.2))"
                        e.currentTarget.style.boxShadow = "0 0 10px rgba(0,200,255,0.25)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = askQuestion.trim() && !askLoading
                        ? "linear-gradient(135deg, rgba(0,200,255,0.25), rgba(0,200,255,0.12))"
                        : "rgba(0,200,255,0.04)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    {askLoading
                      ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                      : <Send size={13} />
                    }
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Save Popup ── */}
          <AnimatePresence>
            {savePopup && activeContent && (
              <SavePopup
                initialTitle={saveTitle} isSaving={saveMutation.isPending}
                error={saveMutation.error ? (saveMutation.error as Error).message : null}
                onSave={(title) => saveMutation.mutate({ title, content: activeContent })}
                onClose={() => { setSavePopup(false); setSaveTitle("") }}
              />
            )}
          </AnimatePresence>

          {/* ── Saved List Panel ── */}
          <AnimatePresence>
            {showSaved && (
              <SavedListPanel
                savedList={savedList} currentLoadedId={loadedSaved?.id ?? null}
                isDeleting={deleteSavedMutation.isPending}
                onLoad={(saved) => { setLoadedSaved(saved); setShowSaved(false) }}
                onDelete={(id) => deleteSavedMutation.mutate(id)}
                onClose={() => setShowSaved(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Resources + YouTube ────────────────────────────────────────────────────────
function ResourcesList({ resources, youtubeVideos }: {
  resources: { title: string; url: string }[]
  youtubeVideos?: YoutubeVideo[]
}) {
  const indian  = youtubeVideos?.filter((v) => v.type === "indian")  ?? []
  const foreign = youtubeVideos?.filter((v) => v.type === "foreign") ?? []

  return (
    <div className="flex flex-col gap-4 mt-1">

      {/* ── Docs / Articles ── */}
      {resources.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.28)" }}>
            <ExternalLink size={10} /> Docs & Articles
          </div>
          {resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-all"
              style={{ color: "#60a5fa", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)", textDecoration: "none" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(96,165,250,0.12)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(96,165,250,0.06)"}
            >
              <ExternalLink size={11} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{r.title}</span>
            </a>
          ))}
        </div>
      )}

      {/* ── YouTube Videos ── */}
      {(indian.length > 0 || foreign.length > 0) && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.28)" }}>
            {/* YouTube SVG icon — lucide doesn't have Youtube */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#ff4444">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z"/>
            </svg>
            YouTube Videos
          </div>

          {/* Indian creators */}
          {indian.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,200,100,0.55)" }}>
                🇮🇳 <span style={{ fontWeight: 600 }}>Indian Creators</span>
              </div>
              {indian.map((v, i) => (
                <VideoCard key={i} video={v} />
              ))}
            </div>
          )}

          {/* Foreign creators */}
          {foreign.length > 0 && (
            <div className="flex flex-col gap-1.5" style={{ marginTop: indian.length > 0 ? "0.5rem" : 0 }}>
              <div className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(180,200,255,0.55)" }}>
                🌍 <span style={{ fontWeight: 600 }}>International Creators</span>
              </div>
              {foreign.map((v, i) => (
                <VideoCard key={i} video={v} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VideoCard({ video }: { video: YoutubeVideo }) {
  return (
    <a
      href={video.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg transition-all"
      style={{
        background: "rgba(255,68,68,0.05)",
        border: "1px solid rgba(255,68,68,0.15)",
        textDecoration: "none",
        padding: "0.55rem 0.75rem 0.55rem 0.6rem",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,68,68,0.1)"
        e.currentTarget.style.borderColor = "rgba(255,68,68,0.3)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,68,68,0.05)"
        e.currentTarget.style.borderColor = "rgba(255,68,68,0.15)"
      }}
    >
      {/* YouTube play icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
        background: "rgba(255,0,0,0.15)",
        border: "1px solid rgba(255,68,68,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4444">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z"/>
        </svg>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.75rem", fontWeight: 600, color: "#e2f0ff",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          lineHeight: 1.4,
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: "0.65rem", color: "rgba(255,100,100,0.75)", marginTop: 2, fontWeight: 500 }}>
          {video.channel}
        </div>
        {/* Search badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontSize: "0.58rem", fontWeight: 600,
          color: "rgba(255,100,100,0.5)",
          background: "rgba(255,68,68,0.08)",
          border: "1px solid rgba(255,68,68,0.15)",
          borderRadius: 3, padding: "1px 5px", marginTop: 3,
        }}>
          opens YouTube search ↗
        </span>
      </div>

      <ExternalLink size={11} style={{ color: "rgba(255,100,100,0.35)", flexShrink: 0 }} />
    </a>
  )
}

// ── Save Popup ─────────────────────────────────────────────────────────────────
function SavePopup({ initialTitle, isSaving, error, onSave, onClose }: {
  initialTitle: string; isSaving: boolean; error: string | null
  onSave: (title: string) => void; onClose: () => void
}) {
  const [title, setTitle] = useState(initialTitle)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="rounded-xl p-6 w-full max-w-sm mx-4"
        style={{ background: "rgba(5,15,40,0.99)", border: "1px solid rgba(167,139,250,0.25)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 font-bold" style={{ color: "#e2f0ff" }}>
            <Bookmark size={16} color="#a78bfa" /> Save Response
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)" }}><X size={16} /></button>
        </div>
        <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Give this response a title to find it later</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
          placeholder="e.g. useState — React State Management" autoFocus
          className="w-full text-sm outline-none rounded-lg px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", color: "#e2f0ff" }}
          onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) onSave(title.trim()) }}
        />
        {error && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{error}</p>}
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg cursor-pointer"
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
          <button onClick={() => { if (title.trim()) onSave(title.trim()) }} disabled={!title.trim() || isSaving}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer"
            style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa", opacity: !title.trim() || isSaving ? 0.5 : 1 }}>
            {isSaving ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <BookmarkCheck size={13} />} Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Saved List Panel ───────────────────────────────────────────────────────────
function SavedListPanel({ savedList, currentLoadedId, isDeleting, onLoad, onDelete, onClose }: {
  savedList: SavedTopicContent[]; currentLoadedId: string | null; isDeleting: boolean
  onLoad: (saved: SavedTopicContent) => void; onDelete: (id: string) => void; onClose: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="rounded-xl p-6 w-full max-w-sm mx-4 flex flex-col"
        style={{ background: "rgba(5,15,40,0.99)", border: "1px solid rgba(167,139,250,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", maxHeight: "70vh" }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 font-bold" style={{ color: "#e2f0ff" }}>
            <BookmarkCheck size={16} color="#a78bfa" /> Saved Responses
            <span className="text-xs font-normal" style={{ color: "rgba(167,139,250,0.5)" }}>{savedList.length}/10</span>
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)" }}><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex flex-col gap-2">
          {savedList.map((saved) => (
            <div key={saved.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: currentLoadedId === saved.id ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${currentLoadedId === saved.id ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.07)"}` }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "#e2f0ff" }}>{saved.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {new Date(saved.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => onLoad(saved)} className="text-xs px-3 py-1 rounded-md cursor-pointer"
                  style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>Load</button>
                <button onClick={() => onDelete(saved.id)} disabled={isDeleting} className="p-1 rounded-md cursor-pointer"
                  style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171" }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Error State ────────────────────────────────────────────────────────────────
function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isNetworkDown = !axios.isAxiosError(error) || error.response == null || error.code === "ERR_NETWORK"
  const isAiError = axios.isAxiosError(error) && error.response != null && error.response.status >= 500
  const title = isNetworkDown ? "Server temporarily unavailable" : isAiError ? "AI generation failed" : "Failed to load content"
  const subtitle = isNetworkDown
    ? "The backend server is not running or unreachable. Please start the server and try again."
    : isAiError ? "The AI model returned an error. Try again in a moment." : "Something went wrong. Please try again."
  return (
    <div className="flex flex-col items-center gap-3 text-center py-10">
      <div className="p-4 rounded-full inline-flex" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
        {isNetworkDown ? <ServerCrash size={28} color="#f87171" /> : <WifiOff size={28} color="#f87171" />}
      </div>
      <div className="font-semibold" style={{ color: "#f87171" }}>{title}</div>
      <div className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{subtitle}</div>
      <button onClick={onRetry} className="mt-1 text-sm px-4 py-2 rounded-lg cursor-pointer"
        style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)", color: "#00c8ff" }}>Try Again</button>
    </div>
  )
}
