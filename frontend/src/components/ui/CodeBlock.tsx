import { useEffect, useRef, useState } from "react"
import hljs from "highlight.js"
import { Copy, Check, ExternalLink, ChevronDown } from "lucide-react"
import LZString from "lz-string"

// ── VS Code Dark+ theme ───────────────────────────────────────────────────────
const THEME_CSS = `
.hljs{background:#1e1e1e;color:#d4d4d4}
.hljs-keyword,.hljs-selector-tag,.hljs-built_in,.hljs-name,.hljs-tag{color:#569cd6}
.hljs-string,.hljs-attr,.hljs-addition{color:#ce9178}
.hljs-comment,.hljs-quote,.hljs-meta,.hljs-deletion{color:#6a9955;font-style:italic}
.hljs-number,.hljs-literal{color:#b5cea8}
.hljs-type,.hljs-class,.hljs-title{color:#4ec9b0}
.hljs-variable,.hljs-template-variable{color:#9cdcfe}
.hljs-property{color:#9cdcfe}
.hljs-function,.hljs-params{color:#dcdcaa}
.hljs-operator,.hljs-punctuation{color:#d4d4d4}
.hljs-regexp{color:#d16969}
.hljs-symbol,.hljs-bullet{color:#c586c0}
.hljs-section{color:#569cd6;font-weight:bold}
.hljs-selector-id,.hljs-selector-class{color:#d7ba7d}
.hljs-link{color:#4ec9b0;text-decoration:underline}
.hljs-emphasis{font-style:italic}
.hljs-strong{font-weight:bold}
`
let themeInjected = false
function injectTheme() {
  if (themeInjected) return
  const style = document.createElement("style")
  style.textContent = THEME_CSS
  document.head.appendChild(style)
  themeInjected = true
}

// ── Language detection ────────────────────────────────────────────────────────
type DetectedLang = "react" | "javascript" | "typescript" | "python" | "java" | "cpp" | "html" | "other"

function detectLang(code: string): DetectedLang {
  if (/import React|from ['"]react['"]|useState|useEffect|<[A-Z][A-Za-z]+[\s/>]/.test(code)) return "react"
  if (/def |print\(|import |from .+ import|class .+:|if __name__/.test(code)) return "python"
  if (/public\s+(static\s+)?void\s+main|System\.out\.println|class\s+\w+\s*\{/.test(code)) return "java"
  if (/#include\s*<|std::|cout\s*<<|int\s+main\s*\(/.test(code)) return "cpp"
  if (/<html|<!DOCTYPE|<body|<div|<script/.test(code)) return "html"
  if (/:\s*(string|number|boolean|void|any|unknown)\b|interface\s+\w+|type\s+\w+\s*=/.test(code)) return "typescript"
  if (/function|const |let |var |=>|console\.log/.test(code)) return "javascript"
  return "other"
}

// ── Playground runners — POST form method (code auto-filled, no login) ────────
type Playground = "codesandbox" | "stackblitz" | "codepen" | "jsfiddle"

// ── Brand logos — real images from /public/logos/ ────────────────────────────
// CodePen has no downloaded logo so keep its SVG; rest use real PNGs
const LOGO_IMGS: Record<string, string | null> = {
  codesandbox: "/logos/code-sandbox-seeklogo.png",
  stackblitz:  "/logos/stackblitz-icon-seeklogo.png",
  codepen:     null, // no file — SVG fallback below
  jsfiddle:    "/logos/jsfiddle-seeklogo.png",
}

function LogoImg({ id, size = 15 }: { id: string; size?: number }) {
  const src = LOGO_IMGS[id]
  if (src) {
    return (
      <img
        src={src}
        alt={id}
        style={{ width: size, height: size, objectFit: "contain", display: "block", filter: "brightness(1.1)" }}
      />
    )
  }
  // CodePen SVG fallback
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 2v7.5M2 8.5l10 5.5 10-5.5M12 22v-7.5M2 15.5l10-5.5M22 15.5l-10-5.5" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  )
}

interface PlaygroundOption {
  id: Playground
  label: string
  supported: (lang: DetectedLang) => boolean
}

const PLAYGROUND_OPTIONS: PlaygroundOption[] = [
  { id: "codesandbox", label: "CodeSandbox", supported: (l) => ["react", "javascript", "typescript", "html"].includes(l) },
  { id: "stackblitz",  label: "StackBlitz",  supported: (l) => ["react", "javascript", "typescript"].includes(l) },
  { id: "codepen",     label: "CodePen",     supported: (l) => ["javascript", "html"].includes(l) },
  { id: "jsfiddle",   label: "JSFiddle",    supported: (l) => ["javascript", "html"].includes(l) },
]

/**
 * Opens a playground in a new tab with the code pre-filled.
 * Uses hidden <form> POST — most reliable cross-browser method, no login needed.
 */
function openInPlayground(code: string, lang: DetectedLang, playground: Playground) {
  if (playground === "codesandbox") {
    // CodeSandbox define API — POST JSON, redirects to live sandbox
    let files: Record<string, { content: string }> = {}

    if (lang === "react") {
      files = {
        "src/App.jsx": { content: code },
        "src/index.jsx": {
          content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')).render(<App />);`,
        },
        "public/index.html": {
          content: `<!DOCTYPE html><html><body><div id="root"></div></body></html>`,
        },
        "package.json": {
          content: JSON.stringify({
            name: "devos-example",
            version: "1.0.0",
            dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
            scripts: { start: "react-scripts start" },
          }),
        },
      }
    } else if (lang === "typescript") {
      files = {
        "src/index.ts": { content: code },
        "package.json": {
          content: JSON.stringify({
            name: "devos-example",
            version: "1.0.0",
            dependencies: { typescript: "^5.0.0" },
          }),
        },
      }
    } else {
      // JS / HTML
      const filename = lang === "html" ? "index.html" : "src/index.js"
      files = {
        [filename]: { content: code },
        "package.json": {
          content: JSON.stringify({ name: "devos-example", version: "1.0.0", dependencies: {} }),
        },
      }
    }

    const form = document.createElement("form")
    form.method = "POST"
    form.action = "https://codesandbox.io/api/v1/sandboxes/define"
    form.target = "_blank"
    form.style.display = "none"

    const input = document.createElement("input")
    input.type = "hidden"
    input.name = "parameters"
    // CodeSandbox requires LZ-string compressed JSON (their custom format)
    input.value = LZString.compressToBase64(JSON.stringify({ files }))
    form.appendChild(input)

    const queryInput = document.createElement("input")
    queryInput.type = "hidden"
    queryInput.name = "query"
    queryInput.value = lang === "react" ? "module=/src/App.jsx" : "module=/src/index.js"
    form.appendChild(queryInput)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
    return
  }

  if (playground === "stackblitz") {
    // StackBlitz POST API
    const form = document.createElement("form")
    form.method = "POST"
    form.action =
      lang === "react"
        ? "https://stackblitz.com/run?view=editor"
        : "https://stackblitz.com/run?view=editor"
    form.target = "_blank"
    form.style.display = "none"

    const addField = (name: string, value: string) => {
      const i = document.createElement("input")
      i.type = "hidden"; i.name = name; i.value = value
      form.appendChild(i)
    }

    if (lang === "react") {
      addField("project[title]", "DeveloperOS Example")
      addField("project[description]", "React example from DeveloperOS")
      addField("project[template]", "create-react-app")
      addField("project[files][src/App.jsx]", code)
      addField("project[files][src/index.jsx]",
        `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')).render(<App />);`)
      addField("project[files][public/index.html]",
        `<!DOCTYPE html><html><body><div id="root"></div></body></html>`)
    } else if (lang === "typescript") {
      addField("project[title]", "DeveloperOS TS Example")
      addField("project[template]", "typescript")
      addField("project[files][index.ts]", code)
    } else {
      addField("project[title]", "DeveloperOS JS Example")
      addField("project[template]", "javascript")
      addField("project[files][index.js]", code)
    }

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
    return
  }

  if (playground === "codepen") {
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "https://codepen.io/pen/define"
    form.target = "_blank"
    form.style.display = "none"

    const input = document.createElement("input")
    input.type = "hidden"
    input.name = "data"
    const penData =
      lang === "html"
        ? { title: "DeveloperOS Example", html: code, css: "", js: "" }
        : { title: "DeveloperOS Example", html: "", css: "", js: code }
    input.value = JSON.stringify(penData)
    form.appendChild(input)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
    return
  }

  if (playground === "jsfiddle") {
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "https://jsfiddle.net/api/post/library/pure/"
    form.target = "_blank"
    form.style.display = "none"

    const addField = (name: string, value: string) => {
      const i = document.createElement("input")
      i.type = "hidden"; i.name = name; i.value = value
      form.appendChild(i)
    }

    if (lang === "html") {
      addField("html", code)
      addField("js", "")
    } else {
      addField("html", "")
      addField("js", code)
    }
    addField("css", "")
    addField("title", "DeveloperOS Example")

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  code: string
  fontSize?: string
}

export default function CodeBlock({ code, fontSize = "0.8rem" }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const lang = detectLang(code)
  const availableOptions = PLAYGROUND_OPTIONS.filter((p) => p.supported(lang))

  useEffect(() => { injectTheme() }, [])

  useEffect(() => {
    if (!ref.current) return
    ref.current.removeAttribute("data-highlighted")
    ref.current.textContent = code
    hljs.highlightElement(ref.current)
  }, [code])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ borderRadius: 10, border: "1px solid rgba(0,200,255,0.12)", overflow: "visible", background: "#1e1e1e" }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.45rem 0.75rem",
        background: "#252526",
        borderRadius: "10px 10px 0 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
      }}>
        {/* Traffic lights + lang badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "block" }} />
          </div>
          <span style={{
            fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
          }}>
            {lang === "other" ? "code" : lang}
          </span>
        </div>

        {/* Actions: Run dropdown + Copy */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }} ref={dropdownRef}>

          {/* Run button with dropdown arrow */}
          {availableOptions.length > 0 && (
            <div style={{ display: "flex", alignItems: "stretch", position: "relative" }}>

              {/* Main Run button — logo + label */}
              <button
                onClick={() => openInPlayground(code, lang, availableOptions[0].id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "3px 9px 3px 7px",
                  borderRadius: availableOptions.length > 1 ? "5px 0 0 5px" : "5px",
                  border: "1px solid rgba(74,222,128,0.3)",
                  borderRight: availableOptions.length > 1 ? "none" : "1px solid rgba(74,222,128,0.3)",
                  background: "rgba(74,222,128,0.08)",
                  color: "#4ade80",
                  fontSize: "0.69rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.18s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.16)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.08)"}
              >
                {/* Brand logo */}
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <LogoImg id={availableOptions[0].id} size={14} />
                </span>
                {availableOptions[0].label}
                <ExternalLink size={9} style={{ opacity: 0.45, flexShrink: 0 }} />
              </button>

              {/* Chevron dropdown trigger */}
              {availableOptions.length > 1 && (
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "3px 5px",
                    borderRadius: "0 5px 5px 0",
                    border: "1px solid rgba(74,222,128,0.3)",
                    borderLeft: "1px solid rgba(74,222,128,0.15)",
                    background: dropdownOpen ? "rgba(74,222,128,0.16)" : "rgba(74,222,128,0.08)",
                    color: "#4ade80", cursor: "pointer",
                    transition: "background 0.18s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.16)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = dropdownOpen ? "rgba(74,222,128,0.16)" : "rgba(74,222,128,0.08)"}
                >
                  <ChevronDown size={10} style={{ transition: "transform 0.18s", transform: dropdownOpen ? "rotate(180deg)" : "none" }} />
                </button>
              )}

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 5px)", right: 0, zIndex: 100,
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 10, overflow: "hidden", minWidth: 200,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.3)",
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "7px 12px 6px",
                    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.13em",
                    color: "rgba(255,255,255,0.18)", textTransform: "uppercase",
                    background: "rgba(255,255,255,0.02)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    Open code in playground
                  </div>

                  {/* Options */}
                  {availableOptions.map((opt, i) => (
                    <button
                      key={opt.id}
                      onClick={() => { setDropdownOpen(false); openInPlayground(code, lang, opt.id) }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "8px 12px",
                        background: "none", border: "none",
                        borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        color: "#e2f0ff", fontSize: "0.8rem", fontWeight: 500,
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.055)"
                        e.currentTarget.style.paddingLeft = "16px"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none"
                        e.currentTarget.style.paddingLeft = "12px"
                      }}
                    >
                      {/* Logo box */}
                      <span style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}>
                        <LogoImg id={opt.id} size={16} />
                      </span>
                      {/* Label + sublabel */}
                      <span style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#e2f0ff" }}>{opt.label}</span>
                        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)" }}>opens prefilled, no login</span>
                      </span>
                      <ExternalLink size={11} style={{ color: "rgba(74,222,128,0.5)", flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              color: copied ? "#4ade80" : "rgba(255,255,255,0.3)",
              fontSize: "0.7rem", fontFamily: "inherit",
              transition: "color 0.2s", padding: "2px 4px",
            }}
            onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}
            onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = "rgba(255,255,255,0.3)" }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* ── Code ── */}
      <pre style={{
        margin: 0, padding: "1rem",
        overflowX: "auto", fontSize, lineHeight: 1.75,
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        background: "#1e1e1e",
        borderRadius: "0 0 10px 10px",
      }}>
        <code ref={ref} />
      </pre>
    </div>
  )
}
