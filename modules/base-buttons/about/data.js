const L = (en, zhCN, ja) => Object.freeze({ en, 'zh-CN': zhCN, ja });

export const about = Object.freeze({
  name: 'Qizhi（Gazerrr）',
  role: L('PRODUCT ENGINEER / AI & AGENT SYSTEMS', '产品工程师 / AI 与 Agent 系统', 'プロダクトエンジニア / AI・エージェントシステム'),
  bio: L(
    'Treats making as a way of asking questions. Works at the intersection of AI agents, product design, and creative tooling, turning vague product ideas into systems that can be used, tested, and iterated. Especially interested in natural language not only as input, but as part of the interface itself.',
    '把创作当成提问的方式。主要在 AI agents、产品设计与创意工具的交叉处工作，把模糊的产品想法变成可以使用、测试和迭代的系统。尤其关注自然语言如何不只是输入，也成为界面本身的一部分。',
    'ものをつくることを、問いを立てる方法として捉えている。AIエージェント、プロダクトデザイン、クリエイティブツールの交差点で、曖昧なプロダクトのアイデアを使い、試し、反復できるシステムに変えている。特に、自然言語を単なる入力ではなく、インターフェースの一部として扱うことに関心がある。',
  ),
  experience: Object.freeze([
    Object.freeze({ label: L('PAST EXPERIENCE', '过往经历', '過去の経験'), name: 'Tencent IEG' }),
  ]),
  works: Object.freeze([
    Object.freeze({
      name: 'Flovvas',
      meta: L('CO-BUILDER / PRIVATE WORK', '共同构建 / 闭源作品', '共同ビルダー / 非公開作品'),
      description: L(
        'A visual AI workbench for thinking on an infinite canvas. Flovvas turns a canvas into context that can carry an idea from exploration toward practice.',
        '建立在无限画布上的思路可视化 AI 工作台。Flovvas 让画布成为能够承载上下文的空间，把一个想法从探索继续带向实践。',
        '無限キャンバス上で思考を可視化するAIワークベンチ。Flovvasはアイデアを探索から実践へ運ぶコンテキストとして、キャンバスを扱う。',
      ),
    }),
    Object.freeze({
      name: 'Skillcraft',
      meta: L('CURRENT PROJECT / PRIVATE WORK', '当前项目 / 闭源作品', '現在のプロジェクト / 非公開作品'),
      description: L(
        'A local-first skill manager for organising Personas and Skills, and shaping how they become a usable working set for local agent workflows.',
        '一个本地优先的 Skill manager，用来整理 Persona 与 Skill，并把它们组织成可用于本地 Agent 工作流的工作集。',
        'PersonaとSkillを整理し、ローカルのエージェントワークフローで使える作業セットへ組み立てる、ローカルファーストのSkillマネージャー。',
      ),
    }),
  ]),
  toolbox: Object.freeze([
    L('BUILD: PYTHON / TYPESCRIPT / JAVASCRIPT', '构建：PYTHON / TYPESCRIPT / JAVASCRIPT', 'BUILD: PYTHON / TYPESCRIPT / JAVASCRIPT'),
    L('WEB: NEXT.JS / REACT / VUE', 'WEB：NEXT.JS / REACT / VUE', 'WEB: NEXT.JS / REACT / VUE'),
    L('AGENTS: CODEX / CLAUDE CODE / MCP', 'AGENTS：CODEX / CLAUDE CODE / MCP', 'AGENTS: CODEX / CLAUDE CODE / MCP'),
    L('INTERACTIVE: ROBLOX / LUAU', '交互：ROBLOX / LUAU', 'インタラクティブ: ROBLOX / LUAU'),
    L('DESIGN: FIGMA / RHINO / GRASSHOPPER', '设计：FIGMA / RHINO / GRASSHOPPER', 'デザイン: FIGMA / RHINO / GRASSHOPPER'),
    L('ENGINEERING: GIT / DOCKER / CLOUDFLARE', '工程：GIT / DOCKER / CLOUDFLARE', 'エンジニアリング: GIT / DOCKER / CLOUDFLARE'),
  ]),
  now: Object.freeze([
    Object.freeze({ key: L('FOCUS', '关注', '関心'), value: L('AI-NATIVE PRODUCTS / AGENT SYSTEMS', 'AI-NATIVE 产品 / Agent 系统', 'AI-NATIVE プロダクト / エージェントシステム') }),
    Object.freeze({ key: L('BUILDING', '正在构建', '構築中'), value: L('SKILLCRAFT', 'SKILLCRAFT', 'SKILLCRAFT') }),
    Object.freeze({ key: L('EXPLORING', '正在探索', '探究中'), value: L('CONVERSATIONAL INTERFACES / INTERACTIVE SYSTEMS', '对话式界面 / 交互系统', '対話型インターフェース / インタラクティブシステム') }),
    Object.freeze({ key: L('METHOD', '方法', '方法'), value: L('TURN VAGUE IDEAS INTO USABLE, TESTABLE SYSTEMS', '把模糊想法变成可使用、可测试的系统', '曖昧なアイデアを、使えて試せるシステムへ') }),
  ]),
});
