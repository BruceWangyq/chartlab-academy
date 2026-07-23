"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/lib/content";
import { DeferredMarketChart } from "@/components/deferred-market-chart";

export function QuizBlock({ lessonId, questions }: { lessonId: string; questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = questions.filter((question) => answers[question.id] === question.answer).length;
  async function submit() {
    if (Object.keys(answers).length !== questions.length) return;
    const response = await fetch("/api/quiz/attempts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, answers }) }).catch(() => null);
    if (response?.ok) { const result = await response.json(); if (result.score !== score) return; }
    setSubmitted(true); window.localStorage.setItem(`chartlab:quiz:${lessonId}`, JSON.stringify({ answers, score, at: new Date().toISOString() }));
  }
  function retry() { setAnswers({}); setSubmitted(false); }
  return <section className="quiz-block"><header><div><span>随堂小测</span><h2>用几道题检查理解</h2></div>{submitted && <strong>{score} / {questions.length}</strong>}</header>
    <ol>{questions.map((question, index) => <li key={question.id}><fieldset disabled={submitted}><legend><span>{index + 1}</span>{question.prompt}</legend>{question.chartSeed !== undefined && <figure className="quiz-chart"><DeferredMarketChart seed={question.chartSeed} height={220} ariaLabel={`第${index + 1}题隐藏未来走势的历史教学K线图`} showDataSummary /><figcaption>历史模拟片段 · 仅供教学 · 请只依据当前可见数据作答</figcaption></figure>}{question.options.map((option, optionIndex) => <label className={`${answers[question.id] === optionIndex ? "selected" : ""} ${submitted && optionIndex === question.answer ? "correct" : ""} ${submitted && answers[question.id] === optionIndex && optionIndex !== question.answer ? "wrong" : ""}`} key={option}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />{String.fromCharCode(65 + optionIndex)}. {option}{submitted && optionIndex === question.answer && <CheckCircle2 />}{submitted && answers[question.id] === optionIndex && optionIndex !== question.answer && <XCircle />}</label>)}</fieldset>{submitted && <p className="quiz-explanation">{question.explanation}</p>}</li>)}</ol>
    <footer>{submitted ? <><p>{score === questions.length ? "全部答对。现在可以进入历史案例检验这个概念。" : "保留这次结果，再试一次找出理解偏差。"}</p><button className="button button-outline" onClick={retry}><RotateCcw size={17} />再做一次</button></> : <button className="button button-primary" disabled={Object.keys(answers).length !== questions.length} onClick={submit}>检查答案</button>}</footer>
  </section>;
}
