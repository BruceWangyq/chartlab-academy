import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chartCases, modules } from "../src/lib/content";
import { articles } from "../src/lib/library";

type Document = Record<string, unknown> & { _id: string; _type: string };
const publishedAt = "2026-07-22T00:00:00.000Z";
const documents: Document[] = [{
  _id: "drafts.author-chartlab-team", _type: "author", name: "ChartLab 内容团队", role: "课程作者",
  bio: "把技术分析概念拆解为可观察、可练习、可复盘的学习动作。",
  credentials: "正式上线前补充具体作者姓名、资历、利益冲突与审核披露。",
}];

function block(key: string, style: "h2" | "normal", text: string) {
  return { _key: key, _type: "block", style, markDefs: [], children: [{ _key: `${key}-span`, _type: "span", marks: [], text }] };
}

for (const course of modules) {
  for (const lesson of course.lessons) {
    const body = lesson.sections.flatMap((section, sectionIndex) => [
      block(`${lesson.id}-h${sectionIndex}`, "h2", section.title),
      ...section.body.map((paragraph, paragraphIndex) => block(`${lesson.id}-p${sectionIndex}-${paragraphIndex}`, "normal", paragraph)),
    ]);
    documents.push({
      _id: `drafts.lesson-${lesson.id}`, _type: "lesson", contentKey: lesson.id, title: lesson.title, slug: { _type: "slug", current: lesson.slug },
      order: Number(lesson.number.split(".")[1]), duration: lesson.duration, free: lesson.free, summary: lesson.summary, objectives: lesson.objectives,
      concepts: lesson.concepts, mistakes: lesson.mistakes, body, contentVersion: "v1", versionNotes: "首发种子；发布前必须完成作者、独立审核、字幕与图表复核。", publishedAt,
      author: { _type: "reference", _ref: "author-chartlab-team" },
      quiz: lesson.quiz.map((question) => ({ _key: question.id, _type: "object", prompt: question.prompt, options: question.options, answer: question.answer, explanation: question.explanation, chartSeed: question.chartSeed })),
      seo: { _type: "object", title: lesson.title, description: lesson.summary },
    });
  }
  documents.push({
    _id: `drafts.course-${course.id}`, _type: "course", contentKey: course.id, code: course.code, title: course.title,
    slug: { _type: "slug", current: course.slug }, description: course.description, order: Number(course.code.slice(1)), enforceSequence: false,
    author: { _type: "reference", _ref: "author-chartlab-team" }, lessons: course.lessons.map((lesson, index) => ({ _key: `${course.id}-${index}`, _type: "reference", _ref: `lesson-${lesson.id}` })),
    seo: { _type: "object", title: course.title, description: course.description },
  });
}

for (const article of articles) documents.push({
  _id: `drafts.article-${article.slug}`, _type: "article", contentKey: `article-${article.slug}`, title: article.title,
  slug: { _type: "slug", current: article.slug }, category: article.category, tags: [article.category], summary: article.summary,
  body: article.body.map((paragraph, index) => block(`article-${article.slug}-${index}`, index === 0 ? "h2" : "normal", paragraph)),
  author: { _type: "reference", _ref: "author-chartlab-team" }, contentVersion: "v1", versionNotes: "首发种子；发布前指派独立审核人。", publishedAt,
  seo: { _type: "object", title: article.title, description: article.summary },
});

for (const chartCase of chartCases) documents.push({
  _id: `drafts.chart-case-${chartCase.id}`, _type: "chartCase", contentKey: chartCase.id, title: chartCase.title,
  slug: { _type: "slug", current: chartCase.slug }, datasetRef: `licensed-dataset-pending/${chartCase.id}`, market: chartCase.market, symbol: chartCase.symbol,
  period: chartCase.period, duration: chartCase.duration, free: chartCase.free, difficulty: chartCase.difficulty, knowledgeTags: chartCase.knowledgeTags,
  task: chartCase.description, rubric: { _type: "object", trend: chartCase.expectedTrend, supportLow: chartCase.support[0], supportHigh: chartCase.support[1], resistanceLow: chartCase.resistance[0], resistanceHigh: chartCase.resistance[1], reactionPoints: chartCase.reactionPoints },
  contentVersion: "v1", versionNotes: "模拟数据种子；正式发布前替换为获授权数据包并完成独立复核。", publishedAt,
  seo: { _type: "object", title: chartCase.title, description: chartCase.description },
});

async function exportSeed() {
  const output = resolve(process.argv[2] ?? "sanity/seed.ndjson");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${documents.map((document) => JSON.stringify(document)).join("\n")}\n`, "utf8");
  console.info(`Exported ${documents.length} draft documents to ${output}`);
}

void exportSeed().catch((error) => { console.error(error); process.exitCode = 1; });
