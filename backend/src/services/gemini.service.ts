import { GoogleGenAI, Type } from "@google/genai"
import { env } from "../config/env"

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

export interface GeneratedContent {
  suggestedTitle: string
  explanationEn:  string
  explanationHi:  string
  explanationHl:  string
  codeExample:    string | null
  interviewQs:    string[]
  resources:      { title: string; url: string }[]
  youtubeVideos:  { title: string; channel: string; url: string; type: "indian" | "foreign" }[]
}

export async function generateTopicContent(
  topicName: string,
  skillName: string
): Promise<GeneratedContent> {

  const prompt = `
You are an expert developer educator — like a senior engineer mentoring a junior developer.

Generate deep, genuine learning content for the topic "${topicName}" in the context of "${skillName}".

For suggestedTitle:
- A short, catchy save title like "useState — React State Management" or "Closures — JS Scope Deep Dive"
- Max 60 characters

For each explanation (English, Hindi, Hinglish):
- Start with a 1-2 line simple definition
- Then explain WHY it matters and WHERE it is used in real projects
- Break into short paragraphs (2-3 sentences each) — NOT one big block
- Include a real-world analogy to make it click
- Mention common mistakes or gotchas developers face
- End with a quick "in short" summary line
- Total: 250-350 words per explanation

For codeExample:
- Write clean, well-commented, RUNNABLE code
- Show a real-world use case, not a toy example
- Add comments explaining the "why", not just the "what"

For interviewQs:
- Mix of conceptual, practical, and tricky questions
- Questions that are actually asked at product companies

For resources:
- Only real, working URLs (MDN, official docs, javascript.info, freeCodeCamp, GeeksforGeeks)

For youtubeVideos:
- Give exactly 4 YouTube search recommendations: 2 Indian creators + 2 foreign creators
- Indian creators (Hinglish/Hindi teaching style): CodeWithHarry, Thapa Technical, Apna College, Hitesh Choudhary, Chai aur Code
- Foreign creators: Fireship, Web Dev Simplified, Kevin Powell, Traversy Media, Academind, Net Ninja
- For the url field: generate a YouTube SEARCH URL in this exact format:
  https://www.youtube.com/results?search_query=TOPIC+CHANNEL+tutorial
  Example: https://www.youtube.com/results?search_query=useState+hook+CodeWithHarry
- title: a descriptive title like "useState Hook Tutorial in Hindi"
- channel: the channel name
- type: "indian" for Indian creators, "foreign" for others
- DO NOT invent video IDs — always use the search URL format above

Hinglish style example: "useState ek React hook hai jo component ke andar state manage karta hai. Jab bhi state change hoti hai, React automatically component ko re-render kar deta hai. Ye bahut useful hai jab aapko dynamic UI banana ho — jaise counter, form inputs, ya toggle buttons."
`.trim()

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: {
              type: Type.STRING,
              description: "Short catchy title for saving — e.g. 'useState — React State Management'",
            },
            explanationEn: {
              type: Type.STRING,
              description: "Rich English explanation with paragraphs, analogy, gotchas, and summary",
            },
            explanationHi: {
              type: Type.STRING,
              description: "Same content in pure Hindi (Devanagari script), paragraph format",
            },
            explanationHl: {
              type: Type.STRING,
              description: "Same content in Hinglish (Hindi in Roman script + English technical terms), conversational tone",
            },
            codeExample: {
              type: Type.STRING,
              description: "Clean, commented, runnable code example showing real-world usage. Empty string if not applicable.",
            },
            interviewQs: {
              type: Type.ARRAY,
              description: "Exactly 5 interview questions — mix of conceptual, practical, tricky",
              items: { type: Type.STRING },
            },
            resources: {
              type: Type.ARRAY,
              description: "Exactly 3 real, working resource links",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url:   { type: Type.STRING },
                },
                required: ["title", "url"],
              },
            },
            youtubeVideos: {
              type: Type.ARRAY,
              description: "Exactly 4 YouTube videos: 2 from Indian creators + 2 from foreign creators teaching this topic",
              items: {
                type: Type.OBJECT,
                properties: {
                  title:   { type: Type.STRING, description: "Actual YouTube video title" },
                  channel: { type: Type.STRING, description: "YouTube channel name" },
                  url:     { type: Type.STRING, description: "Full YouTube video URL: https://youtube.com/watch?v=..." },
                  type:    { type: Type.STRING, description: "indian or foreign" },
                },
                required: ["title", "channel", "url", "type"],
              },
            },
          },
          required: ["suggestedTitle", "explanationEn", "explanationHi", "explanationHl", "codeExample", "interviewQs", "resources", "youtubeVideos"],
        },
      },
    })

    const raw = (response.text ?? "").trim()

    // Strip any markdown code fences Gemini sometimes wraps around JSON
    const text = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    let parsed: GeneratedContent
    try {
      parsed = JSON.parse(text) as GeneratedContent
    } catch {
      // Gemini occasionally emits literal HTML tags (e.g. <p>, <strong>) inside
      // JSON string values, which breaks parsing. Replace them and retry.
      const cleaned = text
        .replace(/<\/?[a-zA-Z][^>]*>/g, "")   // strip HTML tags
        .replace(/\r\n/g, "\\n")               // normalize line endings
      parsed = JSON.parse(cleaned) as GeneratedContent
    }

    // Normalize codeExample
    if (!parsed.codeExample || parsed.codeExample.trim() === "") {
      parsed.codeExample = null
    }

    // Normalize youtubeVideos — ensure array exists
    if (!Array.isArray(parsed.youtubeVideos)) {
      parsed.youtubeVideos = []
    }

    return parsed
  } catch (err) {
    throw new Error(`Gemini generation failed: ${(err as Error).message}`)
  }
}
