import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import { prisma } from "../../database/prisma"
import { generateTopicContent } from "../../services/gemini.service"
import { GoogleGenAI } from "@google/genai"
import { env } from "../../config/env"

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

const router = Router()
router.use(authenticate)

// GET /topic-content/:topicId
// Returns content for a topic — from cache (DB) or generates with Gemini
router.get("/:topicId", async (req, res, next) => {
  try {
    const { topicId } = req.params as { topicId: string }

    // Get the topic — verify it belongs to this user
    const topic = await prisma.topic.findFirst({
      where: { id: topicId, userId: req.userId! },
      include: { skill: { select: { name: true } } },
    })

    if (!topic) {
      res.status(404).json({ success: false, message: "Topic not found" })
      return
    }

    // Check cache first (topicName is shared across all users)
    const cached = await prisma.topicContent.findUnique({
      where: { topicName: topic.name },
    })

    if (cached) {
      res.json({ success: true, data: cached, fromCache: true })
      return
    }

    // Not cached — generate with Gemini
    const generated = await generateTopicContent(topic.name, topic.skill.name)

    // Save to DB (cache forever)
    const saved = await prisma.topicContent.create({
      data: {
        topicName:     topic.name,
        skillName:     topic.skill.name,
        explanationEn: generated.explanationEn,
        explanationHi: generated.explanationHi,
        explanationHl: generated.explanationHl,
        codeExample:   generated.codeExample ?? null,
        interviewQs:   generated.interviewQs,
        resources:     generated.resources,
        youtubeVideos: generated.youtubeVideos ?? [],
      },
    })

    res.json({ success: true, data: saved, fromCache: false })
  } catch (err) {
    next(err)
  }
})

// DELETE /topic-content/:topicId — force regenerate (clear cache)
router.delete("/:topicId", async (req, res, next) => {
  try {
    const topic = await prisma.topic.findFirst({
      where: { id: req.params["topicId"] as string, userId: req.userId! },
    })
    if (!topic) { res.status(404).json({ success: false, message: "Topic not found" }); return }

    await prisma.topicContent.deleteMany({ where: { topicName: topic.name } })
    res.json({ success: true, message: "Cache cleared — will regenerate on next request" })
  } catch (err) { next(err) }
})

// ── Saved content routes ──────────────────────────────────────────────────────

// GET /topic-content/:topicId/saved — list user's saved versions (max 10)
router.get("/:topicId/saved", async (req, res, next) => {
  try {
    const { topicId } = req.params as { topicId: string }

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, userId: req.userId! },
    })
    if (!topic) { res.status(404).json({ success: false, message: "Topic not found" }); return }

    const saved = await prisma.userTopicContent.findMany({
      where: { userId: req.userId!, topicId },
      orderBy: { createdAt: "desc" },
    })

    res.json({ success: true, data: saved })
  } catch (err) { next(err) }
})

// POST /topic-content/:topicId/save — save a version with a title
router.post("/:topicId/save", async (req, res, next) => {
  try {
    const { topicId } = req.params as { topicId: string }
    const { title, content } = req.body as { title: string; content: unknown }

    if (!title?.trim()) {
      res.status(400).json({ success: false, message: "Title is required" })
      return
    }

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, userId: req.userId! },
    })
    if (!topic) { res.status(404).json({ success: false, message: "Topic not found" }); return }

    // Enforce max 10 saved per user per topic
    const count = await prisma.userTopicContent.count({
      where: { userId: req.userId!, topicId },
    })
    if (count >= 10) {
      res.status(400).json({ success: false, message: "Maximum 10 saved responses per topic reached. Delete one to save a new one." })
      return
    }

    const saved = await prisma.userTopicContent.create({
      data: {
        userId:  req.userId!,
        topicId,
        title:   title.trim(),
        content: content as object,
      },
    })

    res.status(201).json({ success: true, data: saved })
  } catch (err) { next(err) }
})

// DELETE /topic-content/:topicId/saved/:savedId — delete a saved version
router.delete("/:topicId/saved/:savedId", async (req, res, next) => {
  try {
    const { topicId, savedId } = req.params as { topicId: string; savedId: string }

    const existing = await prisma.userTopicContent.findFirst({
      where: { id: savedId, userId: req.userId!, topicId },
    })
    if (!existing) { res.status(404).json({ success: false, message: "Saved content not found" }); return }

    await prisma.userTopicContent.delete({ where: { id: savedId } })
    res.json({ success: true, message: "Deleted" })
  } catch (err) { next(err) }
})

// POST /topic-content/:topicId/ask — user asks a custom question about the topic
router.post("/:topicId/ask", async (req, res, next) => {
  try {
    const { topicId } = req.params as { topicId: string }
    const { question } = req.body as { question: string }

    if (!question?.trim()) {
      res.status(400).json({ success: false, message: "Question is required" })
      return
    }

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, userId: req.userId! },
      include: { skill: { select: { name: true } } },
    })
    if (!topic) { res.status(404).json({ success: false, message: "Topic not found" }); return }

    const prompt = `You are an expert developer educator helping a student learn "${topic.name}" in the context of "${topic.skill.name}".

The student asks: "${question.trim()}"

Answer clearly and concisely — like a senior engineer explaining to a junior.
- Use short paragraphs (2-3 sentences each)
- Include a code snippet if relevant (use markdown code blocks)
- Be direct, practical, no fluff
- Max 200-250 words`

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.7, maxOutputTokens: 1024 },
    })

    res.json({ success: true, answer: response.text ?? "" })
  } catch (err) { next(err) }
})

export default router
