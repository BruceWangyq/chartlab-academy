import { defineArrayMember, defineField, defineType } from "sanity";

export const lessonType = defineType({
  name: "lesson", title: "课程小节", type: "document",
  fields: [
    defineField({ name: "contentKey", title: "稳定内容ID", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "title", title: "标题", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", title: "路径", type: "slug", options: { source: "title" }, validation: (rule) => rule.required() }),
    defineField({ name: "order", title: "排序", type: "number", validation: (rule) => rule.integer().min(1).required() }),
    defineField({ name: "duration", title: "预计分钟", type: "number", validation: (rule) => rule.integer().min(1).required() }),
    defineField({ name: "free", title: "免费开放", type: "boolean", initialValue: false }),
    defineField({ name: "summary", title: "摘要", type: "text", rows: 3 }),
    defineField({ name: "objectives", title: "学习目标", type: "array", of: [defineArrayMember({ type: "string" })], validation: (rule) => rule.min(2) }),
    defineField({ name: "concepts", title: "核心概念", type: "array", of: [defineArrayMember({ type: "string" })], validation: (rule) => rule.max(3) }),
    defineField({ name: "body", title: "正文", type: "array", of: [defineArrayMember({ type: "block" }), defineArrayMember({ type: "image", options: { hotspot: true }, fields: [{ name: "alt", type: "string", title: "替代文字", validation: (rule) => rule.required() }] })], validation: (rule) => rule.required().min(6) }),
    defineField({ name: "videoPlaybackId", title: "Mux Playback ID", type: "string" }),
    defineField({ name: "videoSigned", title: "签名播放", type: "boolean", initialValue: true }),
    defineField({ name: "transcript", title: "视频文字稿", type: "text", rows: 12, description: "视频发布前必须提供完整文字稿和字幕。" }),
    defineField({ name: "mistakes", title: "常见误区", type: "array", of: [defineArrayMember({ type: "string" })], validation: (rule) => rule.min(2) }),
    defineField({ name: "quiz", title: "随堂测验", type: "array", of: [defineArrayMember({ type: "object", fields: [defineField({ name: "prompt", title: "题目", type: "string", validation: (rule) => rule.required() }), defineField({ name: "chartSeed", title: "历史图表种子", type: "number", description: "图表判断题填写；留空则只显示文字。", validation: (rule) => rule.integer().min(1) }), defineField({ name: "options", title: "选项", type: "array", of: [{ type: "string" }], validation: (rule) => rule.required().min(3) }), defineField({ name: "answer", title: "正确选项序号", type: "number", validation: (rule) => rule.required().integer().min(0) }), defineField({ name: "explanation", title: "解析", type: "text", validation: (rule) => rule.required() })] })], validation: (rule) => rule.required().min(3).max(5) }),
    defineField({ name: "author", title: "作者", type: "reference", to: [{ type: "author" }], validation: (rule) => rule.required() }),
    defineField({ name: "reviewedBy", title: "审核人", type: "reference", to: [{ type: "author" }], validation: (rule) => rule.required() }),
    defineField({ name: "contentVersion", title: "内容版本", type: "string", initialValue: "v1" }),
    defineField({ name: "versionNotes", title: "版本记录", type: "text", rows: 4 }),
    defineField({ name: "publishedAt", title: "发布日期", type: "datetime" }),
    defineField({ name: "seo", title: "SEO", type: "object", fields: [{ name: "title", type: "string", title: "标题" }, { name: "description", type: "text", rows: 2, title: "描述" }] }),
  ],
  preview: { select: { title: "title", subtitle: "summary" } },
});
