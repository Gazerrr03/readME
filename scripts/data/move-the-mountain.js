const L = (en, zhCN, ja) => Object.freeze({ en, 'zh-CN': zhCN, ja });

export const moveTheMountain = Object.freeze({
  slug: 'move-the-mountain',
  date: '2026-08-15',
  edited: '2026-08-15',
  tag: 'AI',
  title: L("Move the Mountain Elsewhere", "把山搬到别处", "山を別の場所へ移す"),
  body: Object.freeze({
    en: Object.freeze([
  {
    "h": "On moving complexity, iterating in small steps, and how I turned team division into an Agent subscription rental business"
  },
  "A mountain is sitting in front of us. Why must we climb over it?",
  "Because it is there? Because we can take a photo on the summit? Or because project-management software will not let us mark the task “done” if we do not?",
  "If this were the old me, I would probably open a document at the foot of the mountain and carefully write down its height, slope, weather, route, risks, and a task breakdown for “making sure everyone reaches the summit by Friday.” Then I would open a coding agent and discuss how to split the mountain into issues that could run in parallel and issues that had to run in sequence.",
  "Today, a friend said something to me:",
  {
    "q": "Complexity has not disappeared. It has been moved elsewhere."
  },
  "When I first heard it, it sounded a little like project-management sophistry: instead of climbing the mountain, move it somewhere else. It sounded like evasion, even like wrapping “I have not solved it yet” in “I am reorganizing the problem.”",
  "But the sentence stayed with me. I suddenly realized that a lot of what I had done in the past was not solving complexity at all. I was moving it to another place. Worse, sometimes I did not even know that I had already carried it away.",
  {
    "h": "I have a habit of drawing the picture first"
  },
  "I am someone who studies design. One of the deepest habits design training has left me with is imagining the result before I begin.",
  "When I draw, for example, I first imagine what the final picture should look like: how the form will be established, where the light will come from, how the light and shadow will fall, and what kind of atmosphere the image should eventually have. Of course I revise as I go, but the overall movement is still from the endpoint backwards. I start with a picture that does not yet exist on paper, then layer on detail until what is on the paper gradually approaches the image in my head.",
  "Architecture has something similar going on. We often understand a “good building” through elements such as economy, beauty, and usefulness. Economy is relatively easy to quantify and relatively easy to inspect. Beauty and usefulness are not so simple. They are subjective, and much of the feedback arrives late. A building may already be finished before its users discover that it is inconvenient; it may already be standing before everyone realizes that it is not very beautiful. We cannot exactly demolish it and start again just because the final feedback was disappointing.",
  "Computational design has made this somewhat more manageable. People can use parameters, models, and other computable methods to describe and quantify part of a design. It is like cutting off one piece of the mountain and placing it inside a coordinate system, where we can measure, compare, and adjust it. But it only handles one part of the mountain called design. It does not suddenly turn “what makes a design good” into a complete formula.",
  "I still believe that making a good design requires experience, a sense of history, and a sufficiently broad range of knowledge and practice. Many design judgments are not derived from a particular rule. They grow slowly inside us after we have seen things, made things, been rejected, and made them again.",
  "That is why I have always felt a little guilty about the idea of being commissioned to teach someone design. It is not that I do not want to help. It is that I would find it hard to honestly promise: I can completely hand over to you the method for making good design. Agreeing to that would carry a faint suspicion of misleading someone in the name of education.",
  "I am not going to discuss how to teach design here. What matters about this example is that it made me realize something: some problems are complex not because we have not found a clever enough SOP, but because their goals contain elements that are delayed, subjective, and impossible to verify in advance.",
  {
    "h": "Software is not a picture that already exists in your head"
  },
  "Software engineering is not quite like drawing.",
  "Of course, we can plan before development, draw architecture diagrams, write requirements, and spend a long time imagining the final shape of a system. The problem is that software’s final form may not exist at the beginning. We may not know what problems will appear during development, and we may not know whether the robust system we carefully built is actually what users need.",
  "These two unknowns make “understand everything first, then start implementing” extremely expensive.",
  "In drawing, if I decide on the final image at the beginning, I can move forward along the form and the light, step by step. In software, I might spend several weeks thinking through every boundary of a system, only to discover at the end that nobody needs it.",
  "This is why small, fast steps have become increasingly useful. They do not mean “start before you have thought it through,” and they are not an excuse to give up engineering quality. They are more like a clever transfer of complexity: we move the complexity of “sitting in front of a blank sheet of paper and trying to enumerate every possible situation” into the complexity of “facing a concrete problem and thinking about how to solve it.”",
  "The latter is usually easier to handle. A concrete problem has at least given us something: a failed result, real feedback, a place where a user actually got stuck, or a constraint that has already surfaced. We no longer have to use our imagination to play the user, the engineer, the designer, the tester, and our future selves all at once.",
  "My friend said in the meeting that many things in the world are actually simple problems. Simple here does not mean they can be finished immediately. It means that once you truly understand the nature of a problem, you can analyse it and find a path that is relatively definite and relatively explainable.",
  "A simple problem can still be painful. It can still take a long time. But at least it lets you know what to do next. Among all the roads that lead to Rome, you can find the one with the lowest cost for now, the fastest feedback, and the best chance of reaching the destination.",
  "The difficulty of a complex problem is often that you do not even know which road leads to Rome.",
  {
    "h": "Move the mountain elsewhere"
  },
  "The meeting also touched on the DeepSeek harness, which has been getting a lot of attention lately.",
  "In simple technical terms, a harness can be understood as a runtime framework wrapped around a model. It handles things such as how network requests are sent, how model messages are received, how context is organized, how tools are executed, whether a sandbox is used, and how different plugins or providers pass information to the model.",
  "In the past, it was easy to mix these things together and refer to them broadly as “an Agent harness.” That is not entirely wrong, but it makes a system made of many parts look like one enormous, complete black box.",
  "What interests me about the DeepSeek harness is not whether it offers one final, correct answer. It is that it makes part of the complexity visible as something easier to discuss: what a plugin is responsible for, where context comes from, how modules are combined, and whether a particular input actually makes the task better.",
  "This does not make complexity disappear. It moves complexity from “how do I understand an entire Agent engineering system?” to “how do I organize context, manage relationships between modules, and judge the quality of an input?”",
  "The mountain is still there. It has simply changed from one incomprehensible mountain into several rocks that can be moved and inspected separately.",
  "This sentence stayed with me because it applies to more than harnesses. It also explains many of the things I did after taking over Flow canvas.",
  {
    "h": "How I turned team division into an Agent subscription rental business"
  },
  "When I first took over Flow canvas, I had a rather simple but rather heavy idea of what good team division meant: I needed to understand which features we would build at every stage.",
  "So I started talking with my coding agent. How should a feature be built? Which issues should it be split into? What dependencies did they have? Which could run in parallel, and which had to be sequential? As we kept talking, the number of issues grew and the dependency graph became more and more beautiful. I gradually developed a familiar illusion: if this map was complete enough, the team could start working smoothly.",
  "Looking back, I was building a highway for the division of labour. The highway was not even open yet, but I had already started discussing who should be responsible for each toll booth.",
  "In the end, I distributed the issues to the team, and each person continued the conversation with their own Agent. It looked like division of labour. In reality, it was closer to this: I rented everyone’s Agent subscriptions and assembled the results of those rentals.",
  "This does not mean that nobody was working, or that Agents were not useful. The real problem was that each person might receive a local explanation rather than a judgment formed in common. Everyone could make their own task complete, but those complete local pieces did not necessarily belong to the same thing.",
  "I used to understand “talking it through with the Agent” as figuring out the implementation, issues, and dependencies of a feature in advance. Now I am beginning to think that what the team needs to clarify first may be much less than that.",
  "Everyone should first know what experience this feature line is ultimately meant to bring to the user. Where does the user begin? What do they see? What can they complete? Why is this result worth building? The implementation can come later. It can even be explored by each person’s own Agent.",
  "This does not mean turning product development into an acceptance checklist. I am simply beginning to see that the trust a team gives one another should not rest on “I believe you understand the issue.” It should rest on “we all know what this line of work is supposed to make the user feel.”",
  "The unit of a problem is not necessarily an issue, nor is it necessarily a code module. Quite often, it should be a piece of user experience that everyone can understand together.",
  {
    "h": "AI makes individuals broader, but it should not make teams more scattered"
  },
  "AI Agents have changed something very practical: one person can now cover more kinds of work than before.",
  "In the past, a feature might have required product, design, and engineering to participate separately. Now, with the help of an Agent, one person may be able to handle requirements, interaction, pages, and code at the same time. This change is impressive, and it can easily lead to another misunderstanding: if everyone can do more, perhaps all a team needs to do is divide the tasks evenly.",
  "I do not think so.",
  "AI has widened the boundaries of what an individual can do, but a team still needs clear contribution domains. Someone may be better at Agent development, someone else at UI design, and someone else at turning messy requirements into an executable path. Contribution domains are not isolated departments in the traditional sense. They are more like a support network.",
  "Everyone can independently own a feature line. But when someone else runs into a problem involving Agents, interaction, visual design, or engineering, the person with strength in that area should step forward. A person’s ability is not only measured by what they can finish themselves. It is also measured by whether they can help other people take fewer wrong turns.",
  "This may be what an AI-native team means to me now: not four people with their own Agents sitting together, but a group of people who can use AI to cover a wider range while still being willing to share their judgment and experience with one another.",
  "AI makes each person more like a small team. It should not turn the real team into several unrelated small companies.",
  {
    "h": "If you do not roast me, I will roast you"
  },
  "In today’s meeting, I also said something I would probably not normally say so directly:",
  {
    "q": "If you spot a problem during development and do not come roast me, I will roast you instead."
  },
  "It may be the least gentle sentence I have said in the first half of this year. After saying it, I was a little surprised myself: when did I start advocating that people argue in meetings? Had I not always wanted the team atmosphere to be friendly, communication smooth, and pressure low?",
  "But I later felt that these two things were not contradictory.",
  "I do not want people to attack one another, and I do not want arguments to become a performance of team culture. I mean that problems should surface early, and disagreements should appear early. Nobody needs to hide their disagreement in order to preserve surface-level harmony, only to leave one person carrying all the explanation, alignment, and rework at the end.",
  "If nobody on a team ever objects, it may not be because everyone has genuinely reached consensus. It may be because nobody has found a safe enough way to express disagreement.",
  "So I now even think that a team dreaming of making something cool may need to argue at the right moments, and perhaps argue with excessive force. Not to prove who is smarter, and not to defeat anyone, but to make a vague judgment reveal its problems as soon as possible.",
  "Of course, arguing about a proposal is not the same as attacking a person. After the argument, there should also be something clearer than before: what exactly we were arguing about, which parts we have agreed on, and which parts can only be tested through practice.",
  "My friend had often been forced to be the person who pointed out problems, and over time became the “bad guy” on the team. But if every problem has to wait for him to discover it, criticize it, and realign everyone around it, then the team’s surface gentleness is really just transferring the complexity and the burden to one person.",
  "I hope that in the future, everyone can start the argument themselves, and let the friend occasionally be responsible for breaking it up. This division of labour may sound a little healthier than the traditional division between product, design, and engineering.",
  {
    "h": "A not-so-magical copper bullet"
  },
  "Large language models are not a silver bullet. This judgment also came up repeatedly today.",
  "The silver bullet is attractive because it promises to solve a problem in one shot. It does not ask you to understand the ecology, body structure, or moon phases of a werewolf. Just take it out, fire once, and the matter is over. It is perfectly suited to the internet age, because we are always hoping that the next model, the next framework, or the next skill will shoot through complexity on our behalf.",
  "But complexity is usually less cooperative than that.",
  "I would rather call AI a copper bullet. It is not as magical, it does not guarantee a hit, and it will not decide where you should aim. But it is cheap enough, widespread enough, and capable enough to improve a person’s chances of getting something done.",
  "It can let one person cover more product, design, and engineering work. It can help us make a rough baseline faster. It can hand part of the work of organizing context, retrieving information, and repeating routine tasks to a machine. But it will not automatically determine what users need, create consensus for a team, or tell us when a system has become too complex to keep adding to.",
  "A copper bullet is not a failed version of a silver bullet. It is more like a tool that makes no promise of a miracle: you still need to aim, you still need to know where the target is, and you still have to bear the consequences of missing.",
  {
    "h": "The mountain has not disappeared"
  },
  "After listening to the meeting, I immediately asked my coding agent to delete every issue in the current codebase.",
  "I do not think I changed some old habit after this meeting. Many old ways of working are simply what we naturally reach for when we do not yet have enough practical experience. Back then, I did not have enough experience to judge how high a mountain really was, or where I should move it.",
  "What I truly learned this time was a way of thinking about a problem.",
  "When faced with something that looks complex, I do not have to immediately search for a flawless system. I do not have to rush to enumerate every feature, every division of labour, and every possible future scenario. I can ask first: where is the real complexity of this problem? Does it come from unknowns, delayed feedback, coupling between different parts, or a kind of judgment that cannot be fully quantified?",
  "Then I can consider whether to move it somewhere easier to observe, easier to verify, and easier to collaborate around.",
  "Sometimes this means making a very rough version first. Sometimes it means breaking a huge system into modules. Sometimes it means letting the team first form a shared understanding of what the user will receive. Sometimes it means admitting that I cannot directly teach someone what good design is, and can only help them become a good user first: observing, feeling, and accumulating experience.",
  "The mountain is still there.",
  "We have simply stopped treating “getting over the mountain” as the only brave thing to do. Next time, perhaps I will first ask who built the mountain, why I am supposed to climb it, whether I can go around it, and — if I really decide to move it — whether I have thought through where it should go."
]),
    'zh-CN': Object.freeze([
  {
    "h": "关于复杂度转移、小步快跑，以及我如何把团队分工做成了 Agent subscription 租赁业务"
  },
  "面前有一座山，我们为什么一定要翻过去？",
  "因为山在那边？因为翻过去之后可以在山顶拍一张照片？还是因为如果不翻过去，项目管理软件里就没办法把它标记成“已完成”？",
  "如果是以前的我，大概会认真地在山脚下开一个文档，写下山的高度、坡度、天气、路线、风险，以及一份“如何确保所有人都能在周五之前到达山顶”的任务拆分。然后我会打开 coding agent，和它讨论怎么把这座山拆成若干个可以并行、可以串行的 issue。",
  "今天一位友人跟我说了一句话：",
  {
    "q": "复杂度并没有消失，而是被转移了。"
  },
  "我第一次听见这句话的时候，觉得它有一点像项目管理领域的歪理：不爬山了，改成把山搬到别处。听起来像是在逃避问题，甚至像是把“我还没解决”包装成了“我在重新组织问题”。",
  "但这句话后来一直留在我脑子里。因为我突然发现，自己过去做了很多事情，确实不是在解决复杂度，而是在把复杂度换一个地方放着。更糟糕的是，有时候我甚至不知道它已经被我搬走了。",
  {
    "h": "我习惯先画出那幅画"
  },
  "我是一个学设计的人。设计训练给我留下的一个很深的习惯，是在动手之前，先想象结果。",
  "比如画一张画，我会先设想它最后应该是什么样子：形体怎么起，光从哪里来，明暗怎么落，画面最终要形成什么样的气氛。接下来当然也会修改，但整体上，它是一条从终点反推过程的路线。我先有一幅还没有落在纸上的画，再通过一层一层的刻画，让纸上的东西逐渐靠近脑海里的那个形象。",
  "建筑设计也有一点类似的地方。我们经常会用经济、美观、实用这样的要素去理解一个“好的建筑”。经济相对容易量化，也相对容易验收；但美观和实用就没有那么简单。它们带有主观性，而且很多反馈是滞后的。建筑已经建完了，使用者才发现它不好用；建筑已经落地了，大家才发现它并不美观。我们总不能因为最后的反馈不理想，就把建筑拆掉，再重新来一次。",
  "计算性设计的出现，确实让这件事变得更可处理了一些。人们可以用参数、模型和各种可计算的方式，去描述和量化设计的一部分。它像是把一座山切下来一块，放到坐标系里，让我们能够测量、比较、调整。但它只处理了设计这座山的一部分，并没有让“什么才是好的设计”突然变成一套完整的公式。",
  "我仍然相信，做一个好的设计，需要经验、阅历，也需要一个人拥有足够广的认知和实践。很多设计判断并不是从某一条规则里推导出来的，而是在看过、做过、被否定过、重新做过之后，慢慢长在身上的。",
  "所以我一直觉得，如果有人委托我去教别人学设计，我大概会有一点负罪感。不是因为我不愿意帮助别人，而是因为我很难诚实地承诺：我可以把“如何做出好设计”完整地交付给你。答应这件事，多少有一点误人子弟的嫌疑。",
  "当然，我并不打算在这里讨论怎么教设计。这个例子对我真正重要的地方在于：它让我意识到，有些问题之所以复杂，并不是因为我们还没有找到足够聪明的 SOP，而是因为它的目标本身带有滞后、主观和不可预先验证的部分。",
  {
    "h": "软件不是一幅已经存在于脑海里的画"
  },
  "软件工程和绘画不太一样。",
  "我们当然也可以在软件开发之前做规划、画架构图、写需求文档，甚至花很长时间设想最终系统的样子。但问题是，软件的最终形态未必一开始就存在。我们可能不知道开发过程中会遇到什么问题，也可能不知道自己认真搭建出来的那个健壮系统，究竟是不是用户真正需要的东西。",
  "这两个未知会让“先想清楚一切，再开始实现”变得非常昂贵。",
  "在绘画里，如果我一开始就决定了最终画面，后面可以沿着形体和光影逐步推进。可是在软件里，我有可能花了几周时间，把一个系统的所有边界都想得很完整，最后才发现：这个系统根本没有人需要。",
  "这也是为什么小步快跑越来越有用。它不是“没想好就先做”，也不是对工程质量的放弃。它更像一种聪明的复杂度转移：我们把“坐在一张白纸前，试图枚举所有可能情况”的复杂度，转移到了“面对一个具体问题，再思考怎么解决”的复杂度。",
  "后者通常更容易处理。因为具体问题至少已经给了我们一些东西：一个失败的结果、一段真实的反馈、一个用户实际卡住的地方，或者一个已经暴露出来的约束。我们不再需要靠想象力同时扮演用户、工程师、设计师、测试人员和未来的自己。",
  "我的友人在会议里说，世界上有很多事情其实是简单问题。这里的简单，并不是说它马上就能做完，而是说：当你真正理解了问题的本质，就可以通过分析找到一条相对确定、相对可解释的路径。",
  "简单问题也可能很痛苦，也可能需要很长时间。但它至少允许你知道下一步要做什么。你可以在“条条大路通罗马”里，找到一条当前成本最低、反馈最快、最有可能抵达目标的路。",
  "而复杂问题的困难，往往在于你连哪一条路通向罗马都还不知道。",
  {
    "h": "把山搬到别处"
  },
  "会议里也聊到了最近很热门的 DeepSeek harness。",
  "如果把技术背景说得简单一点，harness 可以理解为包在模型周围的一层运行框架：它负责怎么发网络请求、怎么接收模型消息、怎么组织上下文、怎么执行工具、要不要使用沙箱，以及不同插件或 provider 如何把信息交给模型。",
  "过去我们很容易把这些东西混在一起，笼统地称作“Agent 的 harness”。这样做不是完全错误，但它会让一个本来由很多部分组成的系统，看起来像一个巨大而完整的黑盒。",
  "DeepSeek harness 让我感兴趣的地方，不是它是否提供了一个最终正确的答案，而是它把其中一部分复杂度显露成了更容易讨论的东西：插件负责什么，上下文从哪里来，这些模块如何组合，某段输入到底有没有让任务变好。",
  "这并没有让复杂度消失。它只是把复杂度从“如何理解一个完整的 Agent 工程系统”，转移成了“如何组织上下文、管理模块关系、判断输入质量”。",
  "山还在，只是它从一整座看不懂的山，变成了几块可以分别搬动、分别检查的石头。",
  "这句话之所以让我印象深，是因为它不仅适用于 harness。它也解释了我自己后来接手 Flow canvas 时做过的很多事情。",
  {
    "h": "我如何把团队分工做成了 Agent subscription 租赁"
  },
  "刚接手 Flow canvas 的时候，我对“好的团队分工”有一个相当朴素、但也相当沉重的理解：我需要先搞清楚每一个阶段要开发哪些 feature。",
  "于是我开始和自己的 coding agent 聊。一个 feature 怎么做，拆成哪些 issue，有什么依赖，哪些可以并行，哪些必须串行。聊着聊着，issue 越来越多，依赖关系越来越漂亮，我也逐渐产生了一种熟悉的错觉：只要这张图足够完整，团队就可以顺利开始工作了。",
  "现在回头看，我当时更像是在搭建一套分工的高速公路。问题是，高速公路还没有通车，我已经开始讨论每个收费站应该由谁负责。",
  "最后我把这些 issue 分发给团队成员，再由每个人和自己的 Agent 继续沟通。这个过程看起来像分工，实际上更接近于：我租赁了大家的 Agent subscription，然后把不同的租赁结果拼在一起。",
  "这当然不是说大家没有工作，也不是说 Agent 没有帮上忙。真正的问题是，我们每个人拿到的可能只是一个局部解释，而不是一个共同形成的判断。每个人都可以把自己的任务做得很完整，但这些完整的局部不一定属于同一件事情。",
  "我以前把“和 Agent 聊清楚”理解成：把 feature 的实现方式、issue 和依赖都提前想明白。现在我开始意识到，团队真正需要先聊清楚的，可能没有这么多。",
  "大家首先要知道的，是当前阶段这条 feature 线路最终希望给用户带来什么体验。用户从哪里开始，会看到什么，能够完成什么，这个结果为什么值得被做出来。具体实现方式可以晚一点，甚至可以交给每个人自己的 Agent 去探索。",
  "这并不是把产品开发写成一份验收表。我只是开始意识到，团队交付给彼此的信任，不应该建立在“我相信你已经把 issue 理解了”上，而应该建立在“我们都知道这条线路最后应该让用户感受到什么”上。",
  "问题的单位不一定是 issue，也不一定是代码模块。很多时候，它应该是一段可以被共同理解的用户体验。",
  {
    "h": "AI 让个人更宽，但不应该让团队更散"
  },
  "AI Agent 改变了一件很现实的事情：一个人现在可以覆盖比过去更多的工作。",
  "过去一个 feature 可能需要产品、设计和工程三个角色分别参与。现在一个人借助 Agent，可能可以同时处理需求、交互、页面和代码。这个变化很厉害，也很容易让人产生另一个误解：既然每个人都能做更多，那团队是不是只要把任务平均分出去就行了？",
  "我现在觉得不是。",
  "AI 让个人的能力边界变宽了，但团队仍然需要清晰的贡献域。有人更擅长 Agent 开发，有人更擅长 UI 设计，有人更擅长把混乱的需求拆成可执行的路径。贡献域不是传统意义上互相隔离的部门，而更像是一个支撑网络。",
  "每个人可以独立负责一条 feature，但当其他人遇到 Agent、交互、视觉或工程上的问题时，擅长的人应该主动站出来。一个人的能力不只体现在自己能完成什么，也体现在能不能让其他人少走一点弯路。",
  "这可能是我现在理解的 AI-native 团队：不是四个各自拥有 Agent 的人坐在一起，而是一群可以借助 AI 覆盖更大范围、又愿意把自己的判断和经验提供给彼此的人。",
  "AI 让每个人更像一个小团队，但它不应该把真正的团队变成几个互不相干的小公司。",
  {
    "h": "不批斗我，我就批斗你"
  },
  "今天的会议里，我还说了一句平时的自己大概不会说得这么直接的话：",
  {
    "q": "你觉得开发过程里有问题却不来批斗我，那我就批斗你了。"
  },
  "这可能是我前半年来说出的最不温顺的一句话。说完以后我自己都有一点惊讶：我什么时候开始主张大家在会议里吵架了？我以前不是一直希望团队氛围友好、沟通顺畅、大家不要有太大的压力吗？",
  "但后来我觉得，这两件事并不矛盾。",
  "我想要的不是互相攻击，也不是把争吵变成一种团队文化表演。我的意思是，问题应该尽早暴露，分歧应该尽早出现。大家不需要为了维持表面的和谐，把不同意藏到心里，再让一个人最后承担所有的解释、对齐和返工。",
  "如果一个团队从来没有人提出反对意见，可能不是因为大家真的达成了共识，而是因为大家还没有找到一个足够安全的方式来表达不同意见。",
  "所以我现在甚至觉得，一个憧憬着做很酷事情的团队，可能需要适时地、用力过猛地吵架。不是为了证明谁更聪明，也不是为了把谁驳倒，而是为了让一个模糊的判断尽快暴露出它的问题。",
  "当然，争论方案不等于攻击人。吵完之后，也应该留下比吵架之前更清楚的东西：我们到底在争什么，哪些部分已经达成一致，哪些部分只能通过实践验证。",
  "友人之前总是被迫充当那个指出问题的人，久而久之就变成了团队里的“恶人”。但如果所有问题都要等他来发现、来批评、来重新对齐，那团队表面的温和，其实只是把复杂度和负担转移给了一个人。",
  "我希望以后大家能自己先把架吵起来，再让友人偶尔负责劝架。这个分工听起来可能比传统的产品、设计、工程分工更健康一点。",
  {
    "h": "一颗不太神奇的铜弹"
  },
  "大语言模型不是银弹。这个判断今天也被反复提到。",
  "银弹之所以迷人，是因为它承诺一次解决问题。它不要求你理解狼人的生态、身体结构和月相，只要掏出来开一枪，事情就结束了。它非常适合互联网时代，因为我们总是希望下一种模型、下一个框架、下一个 skill 能够替我们把复杂度一枪打穿。",
  "但复杂度通常没有这么配合。",
  "我反而想把 AI 叫作一颗铜弹。它没有那么神奇，也不保证命中，更不会替你判断应该往哪里开枪。但它足够便宜、足够普遍，也足够能提高一个人做成事情的概率。",
  "它可以让一个人覆盖更多产品、设计和工程工作，可以帮助我们更快做出一个 baseline，可以把一部分上下文组织、资料召回和重复劳动交给机器。但它不会自动替我们确定用户需要什么，不会替团队产生共识，也不会替我们判断什么时候一个系统已经复杂到不值得继续加东西。",
  "铜弹不是银弹的失败版本。它更像一种不承诺奇迹的工具：你还是需要瞄准，还是需要知道目标在哪里，也还是要承担没有命中的后果。",
  {
    "h": "山没有消失"
  },
  "听完这次会议之后，我马上让编码智能体删除了当前代码库中的所有 issue。",
  "我不觉得自己在这次会议之后改掉了某个旧习惯。很多旧的做法，本来就是实践经验不足时自然会采取的做法。那时候的我没有足够的经验去判断一座山究竟有多高，也不知道应该把它搬到哪里。",
  "这次真正让我学到的，是一种思考问题的方式。",
  "面对一个看起来很复杂的问题时，我不必立刻开始寻找一个完美无缺的系统，也不必急着把所有 feature、所有分工和所有未来情况都枚举出来。我可以先问：这个问题真正的复杂度在哪里？它是来自未知，来自滞后的反馈，来自不同部分之间的耦合，还是来自某种无法被完整量化的判断？",
  "然后我再考虑，能不能把它转移到一个更容易观察、更容易验证、更容易协作的位置。",
  "有时候，这意味着先做一个很粗糙的版本；有时候，这意味着把一个巨大系统拆成模块；有时候，这意味着让团队先共同理解用户会得到什么；有时候，这意味着承认自己没有办法直接教会别人什么是好的设计，只能让他先成为一个好的用户，去观察、去感受、去积累。",
  "山仍然在那里。",
  "我们只是终于不再把“翻过山”当成唯一一种勇敢的姿势。也许下一次，我会先问问这座山到底是谁修的、为什么要翻、能不能绕过去，以及——如果我真的决定搬它——我是不是已经想清楚了要把它放在哪里。"
]),
    ja: Object.freeze([
  {
    "h": "複雑さの移し替え、小さく早く進めること、そしてチーム分担を Agent subscription のレンタル業にしてしまった話"
  },
  "目の前に山がある。なぜ私たちは、必ずそれを越えなければならないのだろう？",
  "そこに山があるから？ 山頂で写真を撮れるから？ それとも、越えなければプロジェクト管理ソフトで「完了」にできないから？",
  "昔の私なら、山のふもとでドキュメントを開き、山の高さ、傾斜、天気、ルート、リスク、そして「金曜日までに全員を山頂へ到着させるにはどうするか」というタスク分解を、きちんと書き出していただろう。そして coding agent を開き、この山を並行して進められる issue と、順番に進めなければならない issue にどう分けるかを相談していたはずだ。",
  "今日、友人がひとつの言葉をくれた。",
  {
    "q": "複雑さは消えたのではなく、別の場所へ移された。"
  },
  "最初にこの言葉を聞いたとき、プロジェクト管理の世界にある詭弁のように思えた。山を登る代わりに、別の場所へ山を運ぶ。問題から逃げているようにも聞こえるし、「まだ解決できていない」を「問題を組み替えている」と言い換えているだけのようにも聞こえる。",
  "けれど、この言葉はそのあともずっと頭に残った。私はこれまで、複雑さを解決していたのではなく、別の場所へ移していただけなのだと、急に気づいたからだ。しかも、いつの間にかそれを運び出していたことすら、自分では気づいていないことがある。",
  {
    "h": "私は先に、あの絵を描いてしまう"
  },
  "私はデザインを学んでいる人間だ。デザインの訓練が私に残した深い習慣のひとつは、手を動かす前に結果を想像することだった。",
  "たとえば絵を描くとき、私はまず、最終的にどんな絵になるべきかを想像する。形をどう立ち上げるか、光はどこから来るか、明暗はどう落ちるか、画面全体にどんな空気をまとわせるか。もちろん途中で修正はする。それでも全体としては、終点から逆算していく道筋だ。まだ紙の上には存在しない一枚の絵を先に思い浮かべ、それから何層も描き重ねて、紙の上のものを少しずつ頭の中の像へ近づけていく。",
  "建築にも似たところがある。私たちはよく、「良い建築」を経済性、美しさ、実用性といった要素から考える。経済性は比較的数値化しやすく、検査もしやすい。けれど、美しさと実用性はそう簡単ではない。そこには主観性があるし、フィードバックの多くはあとから返ってくる。建物が完成してから、利用者が使いにくさに気づく。建物が建ってから、みんながそれほど美しくないと気づく。最後のフィードバックが望ましくなかったからといって、建物を取り壊して、もう一度やり直すわけにはいかない。",
  "コンピュテーショナルデザインが登場して、この問題はたしかに少し扱いやすくなった。人々はパラメータやモデル、その他の計算可能な方法を使って、デザインの一部を記述し、数値化できるようになった。それは、デザインという山から一部分を切り出して座標系に置き、測定し、比較し、調整できるようにすることに似ている。けれど、それはデザインという山の一部しか扱っていない。「良いデザインとは何か」が突然、完全な公式になるわけではない。",
  "良いデザインを作るには、経験や見聞、そして十分に広い認知と実践が必要だと、私は今でも思っている。多くのデザイン上の判断は、ある規則から導き出されるものではない。見て、作って、否定されて、もう一度作っていくうちに、少しずつ自分の中に育っていくものだ。",
  "だから、誰かにデザインを教えてほしいと頼まれたら、私は少し罪悪感を覚えると思う。人を助けたくないわけではない。ただ、「良いデザインを作る方法を、完全な形であなたに渡せます」と、正直に約束するのが難しいのだ。そんな依頼を引き受けることには、多少なりとも人を誤った方向へ導くようなところがある。",
  "もちろん、ここでデザインの教え方を議論したいわけではない。この例が私にとって重要なのは、ある問題が複雑なのは、十分に賢い SOP がまだ見つかっていないからとは限らない、と気づかせてくれたことだ。目標そのものに、あとから返ってくるフィードバックや、主観性、事前には検証できない部分が含まれていることがある。",
  {
    "h": "ソフトウェアは、頭の中にすでに存在する絵ではない"
  },
  "ソフトウェアエンジニアリングは、絵を描くこととは少し違う。",
  "もちろん開発の前に計画を立て、アーキテクチャ図を描き、要件を書き、最終的なシステムの形を長い時間かけて想像することはできる。けれど、ソフトウェアの最終形は最初から存在しているとは限らない。開発の途中でどんな問題に出会うかもわからないし、時間をかけて丁寧に作った堅牢なシステムが、本当にユーザーの必要としているものなのかもわからない。",
  "この二つの未知があるから、「まずすべてを理解してから、実装を始める」というやり方は、とても高くつく。",
  "絵なら、最初に最終イメージを決めておけば、形と光を一歩ずつ追いながら進められる。けれどソフトウェアでは、システムの境界を何週間もかけて考え抜いたあと、最後になって「そもそも誰もこれを必要としていなかった」と気づくことがある。",
  "だからこそ、小さく、早く進むことがますます役に立つ。それは「考えずに始める」ということでもなければ、エンジニアリングの品質を諦めることでもない。むしろ、賢い複雑さの移し替えに近い。「白紙の前に座り、起こりうる状況をすべて列挙しようとする」複雑さを、「具体的な問題に向き合い、どう解決するかを考える」複雑さへ移すのだ。",
  "後者のほうが、たいてい扱いやすい。具体的な問題は、少なくとも何かを与えてくれる。失敗した結果、現実のフィードバック、ユーザーが実際につまずいた場所、あるいはすでに露出した制約。私たちはもう、想像力だけでユーザー、エンジニア、デザイナー、テスター、そして未来の自分を同時に演じる必要がない。",
  "友人は会議の中で、世の中には実は単純な問題がたくさんあると言っていた。ここでいう「単純」は、すぐ終わるという意味ではない。問題の本質を本当に理解できれば、分析を通して、比較的確かで、比較的説明可能な道筋を見つけられるという意味だ。",
  "単純な問題でも、つらいことはある。時間がかかることもある。けれど少なくとも、次に何をすべきかはわかる。「すべての道はローマに通ず」の中から、今のコストが低く、フィードバックが速く、目的地へ到達する可能性が高い道を選べる。",
  "複雑な問題の難しさは、そもそもどの道がローマへ通じているのかすら、まだわからないことにある。",
  {
    "h": "山を別の場所へ移す"
  },
  "会議では、最近話題になっている DeepSeek harness の話も出た。",
  "技術的な背景を簡単に言えば、harness はモデルの周囲に置かれるランタイムフレームワークだと考えられる。ネットワークへのリクエストをどう送るか、モデルのメッセージをどう受け取るか、コンテキストをどう組み立てるか、ツールをどう実行するか、サンドボックスを使うかどうか、そして異なるプラグインや provider がどのように情報をモデルへ渡すかを扱う。",
  "以前の私たちは、これらを混ぜ合わせて、ひとまとめに「Agent の harness」と呼びがちだった。それは完全に間違いではない。けれど、多くの部分からできているシステムを、巨大でひとつの完全なブラックボックスのように見せてしまう。",
  "DeepSeek harness について私が面白いと思ったのは、最終的に正しい答えをひとつ提供するかどうかではない。その複雑さの一部を、より話しやすいものとして表に出したことだ。プラグインは何を担当するのか、コンテキストはどこから来るのか、モジュールはどう組み合わさるのか、ある入力は本当にタスクを良くしているのか。",
  "これは複雑さを消してはいない。「ひとつの Agent エンジニアリングシステム全体をどう理解するか」という複雑さを、「コンテキストをどう整理するか、モジュール間の関係をどう管理するか、入力の質をどう判断するか」という複雑さへ移しただけだ。",
  "山はまだそこにある。ただ、理解できない一つの大きな山から、別々に動かし、別々に確認できるいくつかの石へと姿を変えた。",
  "この言葉が印象に残ったのは、harness に限った話ではないからだ。Flow canvas を引き継いだあと、私がしていたことの多くも、この言葉で説明できる。",
  {
    "h": "チーム分担を Agent subscription のレンタル業にしてしまった話"
  },
  "Flow canvas を引き継いだばかりのころ、私は「良いチーム分担」について、かなり素朴で、しかも重たい理解を持っていた。各段階でどの feature を開発するのか、まず自分がすべて把握しなければならないと思っていたのだ。",
  "そこで私は coding agent と話し始めた。ひとつの feature はどう作るのか。どの issue に分けるのか。依存関係は何か。どれを並行して進められて、どれは順番に進めなければならないのか。話し続けるうちに issue は増え、依存関係の図はどんどん美しくなった。そして私は、よくある錯覚に陥っていった。この図が十分に完成していれば、チームはスムーズに仕事を始められるはずだ、と。",
  "いま振り返ると、私は分担のための高速道路を作っていた。高速道路はまだ開通していないのに、どの料金所を誰が担当するかを話し始めていたのだ。",
  "最後に私は issue をチームメンバーへ配り、それぞれが自分の Agent と話を続けることになった。これは分担のように見える。けれど実際には、みんなの Agent subscription を借り、そのレンタル結果をつなぎ合わせていたに近い。",
  "もちろん、誰も働いていなかったという意味ではない。Agent が役に立たなかったという意味でもない。本当の問題は、一人ひとりが受け取ったものが、みんなで形成した判断ではなく、局所的な説明にとどまっていたかもしれないことだ。各自が自分のタスクを完璧に仕上げることはできる。けれど、その完璧な局所が、必ずしも同じひとつのものに属しているとは限らない。",
  "以前の私は、「Agent と話を詰める」ということを、feature の実装方法、issue、依存関係をあらかじめ考え切ることだと理解していた。けれど今は、チームが最初に共有すべきことは、そこまで多くないのかもしれないと思い始めている。",
  "まず全員が知るべきなのは、その feature のラインが、最終的にユーザーへどんな体験をもたらすのかだ。ユーザーはどこから始め、何を見て、何を完了できるのか。その結果はなぜ作る価値があるのか。具体的な実装方法はあとでいい。むしろ、一人ひとりが自分の Agent に探求させてもいい。",
  "これはプロダクト開発を受け入れ条件のチェックリストにするという話ではない。チームが互いに渡す信頼は、「あなたは issue を理解していると信じている」ことの上に置くべきではなく、「このラインが最後にユーザーへどんな感覚をもたらすべきかを、私たちはみんな知っている」ことの上に置くべきだ、と考え始めたのだ。",
  "問題の単位は、必ずしも issue ではない。コードモジュールでもない。多くの場合、それはみんなが共同で理解できる、一つのユーザー体験であるべきだ。",
  {
    "h": "AI は個人の幅を広げるが、チームをばらばらにはしない"
  },
  "AI Agent は、とても現実的なことを変えた。一人の人間が、以前より多くの種類の仕事をカバーできるようになったのだ。",
  "以前なら、ひとつの feature にプロダクト、デザイン、エンジニアリングの三つの役割がそれぞれ関わる必要があった。今は Agent の助けを借りれば、一人で要件、インタラクション、ページ、コードを同時に扱えるかもしれない。この変化はすごい。そして、別の誤解も生みやすい。みんながより多くできるなら、チームはタスクを均等に配るだけでいいのではないか、と。",
  "私は、そうではないと思う。",
  "AI は個人ができることの境界を広げる。けれどチームには、やはり明確な貢献領域が必要だ。Agent の開発が得意な人、UI デザインが得意な人、混乱した要件を実行可能な道筋に分解するのが得意な人がいる。貢献領域は、従来の意味で互いに隔離された部署ではない。むしろ支援のネットワークに近い。",
  "一人ひとりが独立してひとつの feature ラインを担当してもいい。けれど、ほかのメンバーが Agent、インタラクション、ビジュアル、エンジニアリングに関する問題に出会ったとき、その領域が得意な人は自分から前に出るべきだ。一人の能力は、自分で何を完成させられるかだけで決まらない。ほかの人が少しでも遠回りをせずに済むようにできるかどうかにも現れる。",
  "これが、いま私が考える AI-native なチームなのかもしれない。各自が Agent を持った四人がただ座っているのではなく、AI を使ってより広い範囲をカバーしながら、自分の判断と経験を互いに差し出せる人たちの集まりだ。",
  "AI は一人ひとりを小さなチームのようにする。けれど、本当のチームまで、互いに関係のない小さな会社の集まりにしてはいけない。",
  {
    "h": "私を「批斗」しないなら、こちらから批斗する"
  },
  "今日の会議で、普段の自分ならここまで直接的には言わないようなことも言った。",
  {
    "q": "開発の途中で問題を感じたのに、私を「批斗」しに来ないなら、こちらから批斗します。"
  },
  "これは、今年の前半に私が口にした中で、いちばん穏やかではない一文だったかもしれない。言ったあと、自分でも少し驚いた。私はいつから、会議でみんなにケンカしてほしいと思うようになったのだろう。チームの雰囲気は友好的で、コミュニケーションは滑らかで、みんなのプレッシャーは大きくないほうがいいと、ずっと思っていたのではなかったか。",
  "けれど、あとで考えてみると、この二つは矛盾しない。",
  "私が望んでいるのは、互いに攻撃することではない。ケンカをチーム文化のパフォーマンスにすることでもない。問題は早く表に出て、意見の違いも早く現れるべきだ、ということだ。表面的な調和を保つために反対意見を心の中へ隠し、最後に一人がすべての説明、認識合わせ、やり直しを背負う必要はない。",
  "チームで誰も反対意見を言わないなら、それは本当に全員が合意に達しているからとは限らない。違う意見を安全に伝える方法を、まだ誰も見つけられていないだけかもしれない。",
  "だから今の私は、何かクールなものを作りたいチームには、適切なタイミングで、少しやりすぎなくらいケンカする必要があるのかもしれない、とさえ思う。誰が賢いかを証明するためでも、誰かを言い負かすためでもない。曖昧な判断の問題を、できるだけ早く表に出すためだ。",
  "もちろん、案について議論することと、人を攻撃することは違う。議論のあとには、議論を始める前よりも明確になった何かが残っていなければならない。私たちはいったい何について争っていたのか。どの部分では合意できたのか。どの部分は実践を通してしか検証できないのか。",
  "友人はこれまで、問題を指摘する役を半ば強制的に引き受けてきた。そしていつの間にか、チームの「悪役」になっていた。けれど、すべての問題を彼が見つけ、批判し、再び認識を合わせるのを待たなければならないなら、チームの表面的な穏やかさは、複雑さと負担を一人へ移しているだけだ。",
  "これからは、みんなが自分で先にケンカを始め、ときどき友人が仲裁を担当できればいいと思う。この分担のほうが、従来のプロダクト、デザイン、エンジニアリングという分担より、少し健全に聞こえるかもしれない。",
  {
    "h": "あまり魔法のない銅の弾"
  },
  "大規模言語モデルは銀の弾丸ではない。この判断も、今日の会議で何度も話題になった。",
  "銀の弾丸が魅力的なのは、一発で問題を解決してくれると約束するからだ。狼男の生態や身体構造、月の満ち欠けを理解する必要はない。取り出して一発撃てば、すべて終わる。次のモデル、次のフレームワーク、次の Skill が、自分の代わりに複雑さを一撃で打ち抜いてくれることを、私たちはいつも期待している。インターネット時代には、実にぴったりの発想だ。",
  "けれど、複雑さはそこまで協力的ではない。",
  "私はむしろ、AI を銅の弾と呼びたい。そこまで魔法ではなく、命中を保証するわけでもなく、どこへ狙いを定めるべきかを代わりに判断してくれるわけでもない。けれど十分に安く、十分に普及していて、一人の人間が何かを成し遂げられる確率を、十分に高めてくれる。",
  "一人でより多くのプロダクト、デザイン、エンジニアリングの仕事をカバーできるようにする。粗いベースラインをより早く作るのを助ける。コンテキストの整理、情報の検索、繰り返し作業の一部を機械へ渡すことができる。けれど、ユーザーが何を必要としているかを自動的に決めることはできない。チームの合意を代わりに作ることもできない。システムが複雑になりすぎて、これ以上ものを足す価値がなくなったタイミングを判断することもできない。",
  "銅の弾は、銀の弾丸に失敗したものではない。奇跡を約束しない道具に近い。あなたは相変わらず狙いを定めなければならない。標的がどこにあるかを知らなければならない。そして、外した結果も引き受けなければならない。",
  {
    "h": "山は消えていない"
  },
  "この会議を聞き終えた直後、私は coding agent に現在のコードベースにあるすべての issue を削除させた。",
  "今回の会議のあと、私は何かひとつの古い習慣を改めたとは思っていない。以前のやり方の多くは、実践経験が足りないときに自然と選んでしまうものだった。そのころの私は、山が本当はどれほど高いのかを判断する経験も、どこへ移せばいいのかを考える経験も足りなかった。",
  "今回、本当に学んだのは、問題について考える方法だった。",
  "複雑そうに見える問題に直面したとき、すぐに完璧なシステムを探し始めなくてもいい。すべての feature、すべての分担、すべての未来の可能性を急いで列挙しなくてもいい。まずこう問える。問題の本当の複雑さはどこにあるのか。未知から来ているのか。遅れて返ってくるフィードバックから来ているのか。異なる部分同士の結合から来ているのか。それとも、完全には数値化できない判断から来ているのか。",
  "そして、それをもっと観察しやすく、検証しやすく、協働しやすい場所へ移せないかを考える。",
  "とても粗いバージョンを先に作る、ということかもしれない。巨大なシステムをモジュールに分ける、ということかもしれない。ユーザーが何を受け取るのかを、まずチームで共有して理解する、ということかもしれない。良いデザインとは何かを直接教えることはできないと認め、まずは良いユーザーになってもらう。観察し、感じ、経験を積んでもらう、ということかもしれない。",
  "山はまだそこにある。",
  "私たちはただ、「山を越える」ことだけを勇敢な姿勢だと思わなくなっただけだ。次に同じことが起きたら、まずこの山を作ったのは誰なのか、なぜ越えなければならないのか、回り道はできないのか、そして——本当に山を移すと決めたのなら——どこへ置くのかを、自分は考え切れているのかを尋ねてみたい。"
]),
  }),
});
