import "server-only";
import { draftMode } from "next/headers";
import { getCmsClient } from "@/lib/cms";
import { chartCases as seedCases, modules as seedModules, type ChartCase, type CourseModule, type Difficulty, type Lesson, type QuizQuestion } from "@/lib/content";
import { articles as seedArticles } from "@/lib/library";

type Block = { _type?: string; style?: string; children?: Array<{ text?: string }>; imageUrl?: string; alt?: string };
type CmsLesson = { _id: string; contentKey?: string; title: string; slug: string; order?: number; duration?: number; free?: boolean; summary?: string; objectives?: string[]; concepts?: string[]; body?: Block[]; mistakes?: string[]; quiz?: Array<{ _key?: string; prompt?: string; options?: string[]; answer?: number; explanation?: string; chartSeed?: number }>; videoPlaybackId?: string; videoSigned?: boolean; transcript?: string };
type CmsCourse = { _id: string; contentKey?: string; code?: string; title: string; slug: string; description?: string; order?: number; lessons?: CmsLesson[] };
export type KnowledgeArticle = { slug: string; category: string; tags: string[]; title: string; summary: string; read: number; body: string[]; author?: string; reviewedBy?: string; publishedAt?: string };

export async function getCourseModules(): Promise<CourseModule[]> {
  const client = getCmsClient(await previewEnabled()); if (!client) return seedModules;
  const data = await client.fetch<CmsCourse[]>(`*[_type == "course"] | order(order asc){_id, contentKey, code, title, "slug": slug.current, description, order, "lessons": lessons[]->|order(order asc){_id, contentKey, title, "slug": slug.current, order, duration, free, summary, objectives, concepts, "body": body[]{..., _type == "image" => {"imageUrl": asset->url, alt}}, mistakes, quiz, videoPlaybackId, videoSigned, transcript}}`, {}, { next: { tags: ["courses"] } }).catch(() => []);
  if (!data.length) return seedModules;
  const accents = ["#3458f4", "#7c5ce7", "#28b8a0", "#f0645b"];
  return data.map((course, courseIndex) => ({ id: course.contentKey ?? course._id, slug: course.slug, code: course.code ?? `M${String(courseIndex + 1).padStart(2, "0")}`, title: course.title, description: course.description ?? "", accent: accents[courseIndex % accents.length], lessons: (course.lessons ?? []).map((lesson, lessonIndex) => normalizeLesson(lesson, courseIndex, lessonIndex)) }));
}

export async function getAllLessons() { return (await getCourseModules()).flatMap((courseModule) => courseModule.lessons); }
export async function getCourseModule(slug: string) { return (await getCourseModules()).find((item) => item.slug === slug); }
export async function getCourseLesson(courseSlug: string, lessonSlugOrId: string) { const courseModule = await getCourseModule(courseSlug); if (!courseModule) return null; const lesson = courseModule.lessons.find((item) => item.slug === lessonSlugOrId || item.id === lessonSlugOrId); return lesson ? { module: courseModule, lesson } : null; }

export async function getChartCases(): Promise<ChartCase[]> {
  const client = getCmsClient(await previewEnabled()); if (!client) return seedCases;
  const data = await client.fetch<Array<Record<string, unknown>>>(`*[_type == "chartCase"] | order(publishedAt asc){_id, contentKey, title, "slug": slug.current, market, symbol, period, duration, free, difficulty, knowledgeTags, task, datasetRef, rubric, publishedAt}`, {}, { next: { tags: ["cases"] } }).catch(() => []);
  if (!data.length) return seedCases;
  return data.map((item, index) => { const rubric = (item.rubric ?? {}) as Record<string, unknown>; return { id: String(item.contentKey ?? item._id), slug: String(item.slug), number: index + 1, title: String(item.title), symbol: String(item.symbol ?? "HIST"), market: String(item.market ?? item.title), period: String(item.period ?? "历史窗口"), difficulty: (["入门", "进阶", "挑战"].includes(String(item.difficulty)) ? item.difficulty : "入门") as Difficulty, duration: Number(item.duration ?? 15), description: String(item.task ?? "完成趋势、支撑、阻力与失效条件分析。"), knowledgeTags: Array.isArray(item.knowledgeTags) ? item.knowledgeTags.map(String) : [], seed: stableSeed(String(item.datasetRef ?? item._id)), expectedTrend: (["up", "down", "range"].includes(String(rubric.trend)) ? rubric.trend : "range") as ChartCase["expectedTrend"], support: [Number(rubric.supportLow ?? 80), Number(rubric.supportHigh ?? 85)], resistance: [Number(rubric.resistanceLow ?? 110), Number(rubric.resistanceHigh ?? 115)], reactionPoints: Array.isArray(rubric.reactionPoints) ? rubric.reactionPoints.map(Number) : [], free: Boolean(item.free) }; });
}
export async function getChartCase(slugOrId: string) { return (await getChartCases()).find((item) => item.slug === slugOrId || item.id === slugOrId); }

export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const client = getCmsClient(await previewEnabled()); if (!client) return seedArticles.map((item) => ({ ...item, tags: [item.category] }));
  const data = await client.fetch<Array<Record<string, unknown>>>(`*[_type == "article"] | order(publishedAt desc){_id, contentKey, title, "slug": slug.current, category, tags, summary, body, "author": author->name, "reviewedBy": reviewedBy->name, publishedAt}`, {}, { next: { tags: ["articles"] } }).catch(() => []);
  if (!data.length) return seedArticles.map((item) => ({ ...item, tags: [item.category] }));
  return data.map((item) => { const body = blocksToParagraphs(item.body as Block[] | undefined); return { slug: String(item.slug), category: String(item.category ?? "基础概念"), tags: Array.isArray(item.tags) ? item.tags.map(String) : [], title: String(item.title), summary: String(item.summary ?? ""), read: Math.max(1, Math.ceil(body.join("").length / 350)), body, author: item.author ? String(item.author) : undefined, reviewedBy: item.reviewedBy ? String(item.reviewedBy) : undefined, publishedAt: item.publishedAt ? String(item.publishedAt) : undefined }; });
}
export async function getKnowledgeArticle(slug: string) { return (await getKnowledgeArticles()).find((item) => item.slug === slug); }

function normalizeLesson(source: CmsLesson, courseIndex: number, lessonIndex: number): Lesson { const quiz = (source.quiz ?? []).filter((item) => item.prompt && item.options?.length && Number.isInteger(item.answer)).map((item, index): QuizQuestion => ({ id: item._key ?? `${source.contentKey ?? source._id}-q${index + 1}`, prompt: item.prompt ?? "", options: item.options ?? [], answer: item.answer ?? 0, explanation: item.explanation ?? "", chartSeed: item.chartSeed })); return { id: source.contentKey ?? source._id, slug: source.slug, number: `${courseIndex + 1}.${lessonIndex + 1}`, title: source.title, duration: source.duration ?? 10, summary: source.summary ?? "", objectives: source.objectives ?? [], concepts: source.concepts ?? [], mistakes: source.mistakes ?? [], sections: blocksToSections(source.body), quiz, free: Boolean(source.free), video: source.videoPlaybackId && source.transcript ? { playbackId: source.videoPlaybackId, transcript: source.transcript, signed: source.videoSigned !== false } : undefined }; }
function blocksToSections(blocks: Block[] | undefined) {
  const sections: Lesson["sections"] = [];
  for (const block of blocks ?? []) {
    if (block._type === "image" && block.imageUrl && block.alt) {
      if (!sections.length) sections.push({ title: "课程内容", body: [] });
      const section = sections.at(-1);
      if (section) (section.images ??= []).push({ url: block.imageUrl, alt: block.alt });
      continue;
    }
    if (block._type !== "block") continue;
    const paragraph = (block.children ?? []).map((child) => child.text ?? "").join("").trim();
    if (!paragraph) continue;
    if (block.style === "h2" || block.style === "h3") sections.push({ title: paragraph, body: [] });
    else { if (!sections.length) sections.push({ title: "课程内容", body: [] }); sections.at(-1)?.body.push(paragraph); }
  }
  return sections.length ? sections : [{ title: "课程内容", body: ["内容编辑正在完成本节正文。"] }];
}
function blocksToParagraphs(blocks: Block[] | undefined) { return (blocks ?? []).filter((block) => block._type === "block").map((block) => (block.children ?? []).map((child) => child.text ?? "").join("").trim()).filter(Boolean); }
function stableSeed(value: string) { let hash = 17; for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0; return hash % 10_000; }
async function previewEnabled() { try { return (await draftMode()).isEnabled; } catch { return false; } }
