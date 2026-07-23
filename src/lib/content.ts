export type Difficulty = "入门" | "进阶" | "挑战";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  chartSeed?: number;
};

export type Lesson = {
  id: string;
  slug: string;
  number: string;
  title: string;
  duration: number;
  summary: string;
  objectives: string[];
  concepts: string[];
  mistakes: string[];
  sections: { title: string; body: string[]; images?: Array<{ url: string; alt: string }> }[];
  quiz: QuizQuestion[];
  free: boolean;
  video?: { playbackId: string; transcript: string; signed: boolean };
};

export type CourseModule = {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  accent: string;
  lessons: Lesson[];
};

export type ChartCase = {
  id: string;
  slug: string;
  number: number;
  title: string;
  symbol: string;
  market: string;
  period: string;
  difficulty: Difficulty;
  duration: number;
  description: string;
  knowledgeTags: string[];
  seed: number;
  expectedTrend: "up" | "down" | "range";
  support: [number, number];
  resistance: [number, number];
  reactionPoints: number[];
  free: boolean;
};

type LessonSeed = Omit<Lesson, "id" | "number" | "quiz" | "free">;
type RawLesson = [string, string, number, string, string[], string[], string[]];

function toLessonSeed(seed: RawLesson): LessonSeed {
  const [slug, title, duration, summary, objectives, concepts, mistakes] = seed;
  return {
    slug,
    title,
    duration,
    summary,
    objectives,
    concepts,
    mistakes,
    sections: [
      {
        title: `理解“${title}”`,
        body: [
          `${summary} 这不是一个孤立信号，而是用来组织观察的语言。先把${concepts.join("、")}分别写成可见事实，再判断它们是否共同支持一个结构结论。`,
          `本节的判断顺序是“位置—行为—确认”：先定位图表所处环境，再描述价格如何反应，最后检查是否有后续证据。遇到“${mistakes[0]}”时，应退回第一步重新描述事实。`,
        ],
      },
      {
        title: "历史片段推演",
        body: [
          `观察本页的历史模拟日线时，先隐藏未来走势。在图上找到与${concepts[0]}有关的两处反应，再用${concepts[1]}检查第一次判断是否得到确认。即使最终方向看对，也不能用后来出现的K线改写当时理由。`,
          `如果图中证据互相冲突，记录“暂不判断”也是有效答案。重点是保留当时可见的证据，并写出哪一种后续变化会使“${title}”的结论成立或失效。`,
        ],
      },
      {
        title: "执行与复盘清单",
        body: [
          `练习时依次完成四个动作：标记${concepts.join("、")}；写一句观察；选择当前结构；补充失效条件。完成后再打开参考答案，对照的是分析过程，不是收益结果。`,
          `复盘时特别检查两类偏差：“${mistakes[0]}”以及“${mistakes[1]}”。如果重复出现，把它们加入笔记标签，下一次只训练一个改进点。`,
        ],
      },
    ],
  };
}

const moduleSeeds: Array<Omit<CourseModule, "lessons"> & { lessons: LessonSeed[] }> = [
  {
    id: "m01", slug: "chart-foundations", code: "M01", title: "图表基础",
    description: "读懂价格、时间、K线与成交量，建立不靠感觉的观察语言。", accent: "#3458f4",
    lessons: ([
      ["market-language", "市场如何写进图表", 12, "价格图表不是预言工具，而是市场参与者行为留下的连续记录。", ["区分观察事实与主观判断", "识别图表的四个基础字段"], ["价格", "时间", "成交量"], ["把单根K线当成完整结论", "先有观点再找证据"]],
      ["candlestick-anatomy", "一根K线包含什么", 14, "开、高、低、收四个价格共同描述一个时间段内的竞价过程。", ["读出K线四价", "比较实体与影线"], ["实体", "上影线", "下影线"], ["用颜色代替方向文字", "忽略时间周期"]],
      ["timeframes", "时间周期与观察尺度", 15, "同一段市场在不同周期里会呈现不同结构，周期决定问题的尺度。", ["选择与问题匹配的周期", "避免混用信号"], ["主周期", "执行周期", "周期嵌套"], ["用分钟图回答长期问题", "频繁切换直到符合预期"]],
      ["volume-basics", "成交量的作用", 13, "成交量描述参与程度，常用于验证突破、衰竭和结构转换。", ["理解量价配合", "识别异常放量"], ["参与度", "放量", "缩量"], ["认为放量必涨", "脱离价格位置看成交量"]],
      ["trend-basics", "趋势的基本概念", 16, "趋势由连续的高点和低点关系定义，而不是由主观的涨跌感觉定义。", ["用高低点描述趋势", "区分趋势与波动"], ["更高高点", "更高低点", "结构确认"], ["只看一段斜率", "过早宣告反转"]],
      ["risk-boundary", "先写下失效条件", 12, "分析必须说明何时不再成立；失效条件让观点可以被检验和复盘。", ["为判断设置失效点", "把不确定性写进结论"], ["失效条件", "证据权重", "风险意识"], ["只写目标不写失效", "把判断错误等同于能力失败"]],
    ] as RawLesson[]).map(toLessonSeed),
  },
  {
    id: "m02", slug: "candlestick-language", code: "M02", title: "K线语言",
    description: "把单根与组合K线放回市场结构，理解价格行为而非背诵名字。", accent: "#8d54db",
    lessons: ([
      ["single-bar", "单根K线的力量与局限", 15, "一根K线只记录局部竞价结果，必须结合位置和前后文。", ["描述实体和影线", "说明单根信号的局限"], ["拒绝", "动能", "位置"], ["看到长影线就反向", "忽略后续确认"]],
      ["two-bar", "两根K线的关系", 16, "两根相邻K线可以显示接纳、拒绝、吞没或犹豫。", ["比较两根K线区间", "识别接纳与拒绝"], ["吞没", "内包", "外包"], ["背诵名称不看区间", "忽略成交量"]],
      ["multi-bar", "多根K线与局部结构", 17, "多根K线组合的价值在于揭示一段时间内的推进与回撤节奏。", ["观察推进和回撤", "标记局部转折"], ["推进", "回撤", "重叠度"], ["把任意三根K线命名", "忽略更高周期"]],
      ["gaps", "缺口与价格接纳", 14, "缺口是相邻交易区间的不连续，需要结合市场类型与后续回补判断。", ["识别缺口类型", "观察回补速度"], ["普通缺口", "突破缺口", "衰竭缺口"], ["认为缺口一定回补", "忽略除权和交易时段"]],
      ["context", "没有上下文就没有形态", 18, "相同K线出现在趋势中段、关键区域或震荡边缘时，意义可能完全不同。", ["先定位再命名", "列出支持与反对证据"], ["位置", "背景趋势", "确认"], ["先识别形态再找位置", "只保留支持观点的证据"]],
      ["false-signals", "识别假突破与失败信号", 18, "失败信号常比原信号更有信息量，因为它暴露了市场未能维持的方向。", ["定义有效突破", "识别快速收回"], ["突破", "收回", "跟随"], ["盘中刺穿就算突破", "没有时间或幅度条件"]],
    ] as RawLesson[]).map(toLessonSeed),
  },
  {
    id: "m03", slug: "trend-structure", code: "M03", title: "趋势结构",
    description: "用高低点、趋势线、区间和多周期关系建立可复核的结构判断。", accent: "#e18a36",
    lessons: ([
      ["swings", "标记关键高低点", 17, "关键摆动点应由可见反应确认，而不是给每个微小波动贴标签。", ["标记摆动高低点", "区分关键与噪声"], ["摆动点", "反应幅度", "确认"], ["标出所有波动", "事后移动标记"]],
      ["up-down", "上升、下降与震荡", 16, "趋势方向来自高低点序列；序列混合时应承认震荡或转换状态。", ["分类三种结构", "表达不确定状态"], ["上升结构", "下降结构", "震荡"], ["非涨即跌", "把单次破位当反转"]],
      ["trendlines", "趋势线的绘制", 18, "趋势线连接有意义的反应点，用来观察节奏，不是不可穿越的墙。", ["选择有效锚点", "区分突破与噪声"], ["锚点", "触碰", "斜率"], ["强行贴合所有价格", "不断重画以保持有效"]],
      ["ranges", "区间与平衡", 19, "区间表示买卖双方暂时平衡，应关注边缘反应和中部低信息区。", ["识别区间边缘", "避免在中部过度判断"], ["上沿", "下沿", "价值中枢"], ["把每次横盘都当区间", "忽略假突破"]],
      ["transition", "趋势如何发生转换", 20, "结构转换通常经历动能减弱、关键点失守和反向跟随，而非一个瞬间。", ["列出转换证据链", "区分减速与反转"], ["减速", "破坏", "跟随"], ["一根反向K线即反转", "忽略回抽确认"]],
      ["multi-timeframe", "多周期结构对齐", 21, "高周期定义背景，主周期做判断，低周期只服务于执行细节。", ["建立三层周期框架", "处理周期冲突"], ["背景周期", "主周期", "执行周期"], ["所有周期都要同向", "低周期噪声推翻高周期"]],
    ] as RawLesson[]).map(toLessonSeed),
  },
  {
    id: "m04", slug: "support-resistance", code: "M04", title: "支撑与阻力",
    description: "把关键价位画成区域，理解角色转换、确认、失效与复盘。", accent: "#28b8a0",
    lessons: ([
      ["sr-definition", "支撑与阻力的定义", 16, "支撑和阻力是历史上供需明显变化的区域，不是精确到小数点的神奇价格。", ["用区域表达关键位置", "解释供需变化"], ["支撑", "阻力", "反应区域"], ["把区域画成细线", "认为触及必反转"]],
      ["zone-drawing", "如何绘制关键区域", 19, "区域边界应覆盖主要反应密集带，同时避免宽到失去决策价值。", ["选择反应样本", "控制区域宽度"], ["密集反应", "极值", "收盘"], ["只取最高最低点", "区域覆盖过宽"]],
      ["role-reversal", "角色转换", 18, "被有效突破的阻力可能成为支撑，前提是市场在新区域获得接纳。", ["识别有效突破", "观察回踩接纳"], ["突破", "回踩", "接纳"], ["所有突破都角色转换", "忽略快速跌回"]],
      ["confirmation", "确认与证据组合", 20, "可靠判断来自位置、结构、价格行为和参与度的证据组合，而非单一信号。", ["组织多类证据", "给证据分配权重"], ["位置", "结构", "成交量"], ["指标越多越可靠", "重复计算同类证据"]],
      ["invalidation", "区域何时失效", 18, "连续接纳、反应衰减或结构环境改变，都可能使旧区域失去意义。", ["定义区域失效", "更新而非执着旧标记"], ["接纳", "衰减", "环境变化"], ["价格穿越一次就删除", "永远保留历史区域"]],
      ["complete-review", "完成一份结构化复盘", 22, "复盘记录当时可见的信息、判断依据和失效条件，而不是用未来走势改写理由。", ["保存判断快照", "区分过程质量与结果"], ["快照", "理由标签", "过程质量"], ["只记录对错", "事后补写当时未见证据"]],
    ] as RawLesson[]).map(toLessonSeed),
  },
];

function createQuiz(lesson: LessonSeed, moduleIndex: number, lessonIndex: number): QuizQuestion[] {
  const base = `${moduleIndex + 1}-${lessonIndex + 1}`;
  return [
    { id: `${base}-a`, prompt: `学习“${lesson.title}”时，第一步最应该做什么？`, options: ["先写下希望看到的结论", "先描述可复核的图表事实", "立即预测下一根K线", "寻找收益最高的做法"], answer: 1, explanation: "先观察后解释可以减少确认偏误，也让分析过程能够被复核。" },
    { id: `${base}-b`, prompt: `下列哪项最符合“${lesson.title}”的学习目标？`, options: [lesson.objectives[0], "记住唯一正确答案", "保证预测准确", "忽略不支持观点的证据"], answer: 0, explanation: `${lesson.objectives[0]}是本节可执行、可检验的目标。` },
    { id: `${base}-c`, prompt: "观察这段隐藏未来走势的历史图表，哪种判断过程最完整？", options: ["只凭最后一根K线预测方向", `先描述${lesson.concepts[0]}等可见事实，再写失效条件`, "根据希望获得的收益选择方向", "反复切换周期直到图表符合预期"], answer: 1, explanation: `图表判断应先描述${lesson.concepts.join("、")}等当时可见的证据，再写出失效条件；不能用收益预期或事后信息替代分析。`, chartSeed: (moduleIndex + 1) * 100 + lessonIndex + 1 },
  ];
}

export const modules: CourseModule[] = moduleSeeds.map((module, moduleIndex) => ({
  ...module,
  lessons: module.lessons.map((lesson, lessonIndex) => ({
    ...lesson,
    id: `${module.id}-l${String(lessonIndex + 1).padStart(2, "0")}`,
    number: `${moduleIndex + 1}.${lessonIndex + 1}`,
    quiz: createQuiz(lesson, moduleIndex, lessonIndex),
    free: moduleIndex === 0,
  })),
}));

export const lessons = modules.flatMap((module) => module.lessons);

const caseSeeds = [
  ["标普500指数", "SPX", "趋势反转", "支撑阻力"], ["纳斯达克100指数", "NDX", "上升趋势", "趋势线"],
  ["黄金现货", "XAU", "区间突破", "成交量"], ["欧元美元", "EURUSD", "下降趋势", "角色转换"],
  ["美国十年期国债", "UST10Y", "震荡区间", "假突破"], ["原油", "WTI", "结构转换", "风险边界"],
] as const;
const caseTitles = ["关键区域的第一次测试", "突破后的回踩", "趋势减速与反向确认", "区间边缘的失败信号", "多周期结构冲突"];

export const chartCases: ChartCase[] = Array.from({ length: 30 }, (_, index) => {
  const seed = caseSeeds[index % caseSeeds.length];
  const cycle = Math.floor(index / caseSeeds.length);
  const direction = (["down", "up", "range", "down", "range", "up"] as const)[index % 6];
  const base = 88 + (index % 7) * 11;
  return {
    id: `case-${String(index + 1).padStart(2, "0")}`, slug: `historical-case-${String(index + 1).padStart(2, "0")}`, number: index + 1,
    title: `${seed[0]}：${caseTitles[cycle]}`, symbol: seed[1], market: seed[0], period: `${2018 + cycle}-01 — ${2018 + cycle}-12`,
    difficulty: index < 8 ? "入门" : index < 22 ? "进阶" : "挑战", duration: 12 + (index % 4) * 4,
    description: `观察${seed[0]}在关键位置附近的结构变化，先判断趋势，再标记区域并写下失效条件。`,
    knowledgeTags: [seed[2], seed[3], "结构复盘"], seed: 17 + index * 13, expectedTrend: direction,
    support: [base - 8, base - 2], resistance: [base + 24, base + 31], reactionPoints: [24 + (index % 5), 55 + (index % 7), 83 + (index % 9)],
    free: index < 5,
  };
});

export function getModule(slug: string) { return modules.find((module) => module.slug === slug); }
export function getLesson(slug: string) {
  const lesson = lessons.find((item) => item.slug === slug);
  const courseModule = modules.find((item) => item.lessons.some((entry) => entry.slug === slug));
  return lesson && courseModule ? { lesson, module: courseModule } : undefined;
}
export function getCase(slug: string) { return chartCases.find((item) => item.slug === slug); }

export const contentCounts = {
  modules: modules.length,
  lessons: lessons.length,
  questions: lessons.reduce((sum, lesson) => sum + lesson.quiz.length, 0),
  cases: chartCases.length,
};
