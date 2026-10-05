const L = (en, zhCN, ja) => Object.freeze({ en, 'zh-CN': zhCN, ja });

const bodyEn = Object.freeze([
  "I did not get into the school I had been certain I would attend.",
  "For a long time, I did not want to call it a rejection. The word felt too light, as if it described an ordinary result. What I saw in that result was also the fixation left by my failure in the gaokao, the time I had invested during my undergraduate years, and the guilt I felt toward the people around me. It felt as though a road I had been walking for years had suddenly been cut off. The road was still there, but its direction no longer felt as certain as before.",
  "I knew how I was supposed to comfort myself. One result could not describe an entire person. Effort did not become meaningless simply because it failed to produce the result I expected. I could say all of that. Sometimes I even believed it. But at night, or whenever I came across advice about graduate school and careers online, I would still count the experience as a failure.",
  "Online advice easily creates the impression that life has a few routes that have already been validated. At a certain age, you should have a certain result; you should attend a certain kind of school; you should build abilities in a certain order; then you should move on to the next stage. Most of these accounts describe only the routes that worked. Someone who leaves the route has a hard time seeing themselves in them. They begin to worry that this deviation will become an unrecoverable flaw at some more important moment in the future.",
  "I have had that fear too. I doubted whether the things I had done were useful at all, and whether my effort was changing anything. Eventually I realized that the question I really wanted to ask was not whether this event counted as success or failure. It was this: who gets to decide what success and failure mean?",
  {
    "h": "Where You Stand to Look at a Mountain"
  },
  "Imagine someone opening a coffee shop in a neighborhood. What would count as success?",
  "They might want to turn it into a hundred-year-old institution. They might make it a hit, earn enough money, and leave. They might build an independent brand. Or they might simply want a place they were willing to walk into and work in every day. Perhaps opening the shop at all would be enough.",
  "All of these answers make sense. The shop stays the same, but people standing in different places see different mountains. Su Shi wrote that, viewed from different sides, a mountain becomes a ridge or a peak; distance and height change what you see.",
  "My mistake was treating one of those positions as the only position. The result of my graduate-school application, the name of the school, and the route that looked safest to other people became a ruler. When the result did not fall where the ruler said it should, the conclusion followed automatically: failure, which meant that my effort had not been effective enough.",
  "I do not want to pretend that external evaluation is irrelevant. Results create real differences in opportunity, and a school can affect a person’s starting point. Disliking a standard does not make it disappear. But I have started to think that there should not be only one ruler for judging a person. At the very least, the ruler I use to ask whether I am becoming better should not be kept entirely by other people.",
  "That is not a way to design a game in which I can never lose. It asks me to answer a harder question first: what kind of person do I want to become? What will tell me that I am moving toward that person, or away from them?",
  {
    "h": "Reading with My Mistakes"
  },
  "This summer, while working on an independent product, I drew up a detailed development plan. I had listed requirements, features, and tasks, but I had not really worked out which deserved to come first. Ideas with little connection to the product’s main purpose made their way into the plan too. As the list grew, deciding what to leave out became harder.",
  "Looking back, I was easily drawn to a feature but much less good at judging its value. If I saw a good design in another product, I wanted to bring it into mine. If I imagined a possible use, I thought it justified adding a feature. I did not give the same attention to asking when a user would need it, or what difficulty they would face without it.",
  "These gaps in judgment had concrete consequences during development. Once an untested idea entered the plan, the team had to spend time understanding, designing, and implementing it. It could also create ongoing maintenance work. By the time we realized it had little to do with the most pressing problem, removing it was no longer easy. I had done a lot of work without having a good enough reason for doing that work first.",
  "We later began changing our approach. We first discussed which needs were worth investing in for a particular release, then each person took responsibility for defining, developing, and validating one of them. This gave me more specific questions to ask: could a feature help users do something they had previously struggled to do? Would its absence cause them to stop using the product? These questions deserved more attention than “this feature looks good.” Still, knowing what to ask did not mean I knew how to find reliable answers.",
  "That is why I want to read The Right It with these experiences in mind. I want to revisit the features I once argued for. What made me believe they were valuable? Which reasons came from users, and which were only my assumptions? If I were starting again, could I first run a smaller experiment to find out whether users needed the feature, before committing to development?",
  "For me, reading with my mistakes means returning to decisions I made, hesitated over, or got wrong. When I encounter a method in the book, I can connect it to a particular discussion or feature and ask whether it actually explains the problem we faced. It may not fit my circumstances, but comparing the two can show me what is still missing from my judgment.",
  "I used to think that, with AI, I could learn almost anything. It has certainly helped me learn tools and turn ideas into working things more quickly. But judging whether a finished feature has value requires looking at how users use it and what feedback they give. I encountered these questions in my work over the summer. Now I want reading to help me turn those scattered observations into methods I can use the next time I have to make a choice.",
  {
    "h": "Between Knowing and Doing"
  },
  "I used to divide knowing and doing into two stages: learn first and act when I was ready, or act first and summarize the experience afterward. But when you are actually making a product, they rarely line up so neatly.",
  "A low-cost prototype often requires action first. Before speaking to users, many needs remain guesses. Once the prototype exists, and you can see where users get stuck, you know what to ask, what to read, and what to change next.",
  "A feature that changes the product’s core structure cannot be pushed forward by endless trials alone. Some questions need to be settled first: who is it for, what problem does it solve, what counts as done, and what will stay out of this version? Without those boundaries, the faster you act, the more burden you may leave behind.",
  "The difficult part is not choosing between knowing first and doing first. It is recognizing what kind of knowing is missing now, and what kind of action can help you obtain it.",
  "This is the ability I most want to gain during graduate school. For me, it will shape the rest of my life more deeply than publishing a paper in a top journal. A paper can show that I completed one piece of research. The movement back and forth between knowing and doing determines whether I can begin again when I meet the next problem.",
  "I often feel that my chain of thought is too short. My mind jumps. Given a question, I can quickly find several related points in my head and assemble them into something that sounds logical. That speed is sometimes useful, but it also makes me rely too much on what I read recently, what I said recently, and the answer from my most recent search.",
  "Connecting scattered points does not mean they have become a structure. Before I speak, I need to pause and ask: who am I saying this to? What do I want them to know or do? What kind of expression do they need? What can wait? Is the thing I find interesting actually relevant to this question?",
  "I have seen the same problem in Agents. If an Agent carries the leftovers of its previous task directly into the next one, it may mistake recent memory for the most important part of the current task. People do this too. We do not need to keep every experience active. Before making a judgment, we sometimes need to put aside what is too close and too familiar.",
  {
    "h": "Turning an Agent Method Back on Myself"
  },
  "I used to resent school because it often handles complex people through a fixed evaluation system. Grades, rankings, papers, and admissions results are easy to compare. After a while, we start using those measures to explain ourselves.",
  "What I want to borrow now is not the idea that a person is an Agent, or that life can be written as an automatically executable script. I want to borrow the things I repeatedly do when working with an Agent: state the goal clearly, define the boundary of action, say what counts as complete, leave room for feedback, and revise the next prompt according to the result.",
  "These steps work because an Agent cannot automatically know what the vague phrase “do better” means in my head. If the goal is unclear, it may work efficiently in the wrong direction. Without boundaries, it keeps adding things. Without a stop condition, it mistakes continued generation for completion. Writing a goal forces me to turn a vague wish into a direction I can inspect.",
  "People often lack the same inspection. We know we want to improve, but we do not say what “better” means. We use a result that has just happened to judge ourselves. We read another person’s account of success and immediately add it to our own standards. The evaluation system keeps directing our actions, but we never write it down, look back at it, or revise it.",
  "So I want to turn the method used to guide an Agent back on myself. The system prompt reminds me what principles to follow. The goal tells me where to put my effort in the current stage. The evaluation standard checks whether my actions are actually taking me there. These are not three separate documents. They are one set of tools for continuously correcting my direction.",
  "The prompt can be short, like Asimov’s Three Laws of Robotics. I can start with a few rules that will genuinely affect my actions:",
  {
    "q": "Do not treat one result as the whole judgment."
  },
  {
    "q": "Use action to obtain feedback, then use reading and reflection to interpret it."
  },
  {
    "q": "Do not let the information I encountered most recently make the decision for me."
  },
  {
    "q": "Before adding more, confirm the goal, the value, and the stop condition."
  },
  "This prompt will not be finished in one sitting. One day I may decide that a better version of myself should also keep regular hours, respond more promptly to the trust others place in me, or save the other person some information bandwidth before I speak. I can add that understanding then.",
  "But I do not want the prompt to become an ever-growing list of rules. A standard deserves to stay because it changes my actions and brings me closer to the person I want to become. If it only makes me look more complete on paper, or gives my anxiety a new outlet, it does not need to be added.",
  "A smooth period requires caution too. Good fortune can make people overestimate themselves and mistake luck for ability. Fresh experiences carry the strongest emotions, but they are not always ready to become long-term judgments. I want to set the experience down for a while, keep the lesson that came from it, and let new knowledge and another action test it.",
  "Experiences need to be suspended; lessons need to be archived; an evaluation system needs to remain revisable. It should hold new discoveries without being rewritten every time by shame, anxiety, or a moment of excitement.",
  {
    "h": "Choosing Which Voices Enter"
  },
  "I used to understand information overload as “too much information.” Now I think the deeper problem is that a person slowly loses the ability to decide what information enters their judgment, and when.",
  "The internet is full of roads that appear to run in only one direction. They tell you what result you should have at a certain age, what future belongs to a certain school, what choice counts as rational, and which deviations will become a lifelong regret. These experiences are not necessarily wrong, but they should not receive the authority to judge me without being examined first.",
  "I do not need a place that collects every piece of information. I need an entrance. I need to know which voices are worth hearing, which are only repeating a route someone else has taken, and when to leave the screen and return to my own actions.",
  "I still hope that one day I can become someone capable of changing the rules. That sentence is still too large for me, so I can only make it more concrete for now: I want to develop judgment reliable enough that I am no longer a prisoner of online empiricism. I want to help decide what deserves evaluation, what deserves continuation, and what should be put down.",
  "This is not an ability I already possess. It is a direction I am willing to practice for a long time.",
  {
    "h": "The Prompt Is Not Finished"
  },
  "I cannot say that I have accepted the graduate-school result. At times I still read it as a failure. It still brings back the memory of failing the gaokao, and it still makes me wonder whether my past efforts were useful at all.",
  "But I am beginning to understand that accepting the result is not the only task. I also need to look back at the system that interpreted the result for me.",
  "I want to write myself a system prompt. It does not need to be long, and it will not be completed in one attempt. The next time results, experience, and information push me forward, it can at least make me stop and ask three questions:",
  "Who am I becoming?",
  "What standard am I using to judge myself?",
  "Where will this action take me?",
  "The next version of this prompt begins with reading The Right It. I will read it with the mistakes I have already made, return to action with a new understanding, and revise the prompt when the next action exposes a new problem.",
  "I have not finished designing myself. I am only beginning to admit that I cannot leave the whole task to other people."
]);

const bodyZh = Object.freeze([
  "我没有去成那所原本以为一定能去的学校。",
  "这件事发生之后，我很长时间都不太愿意用“落选”来称呼它。这个词太轻了，像是在说一次普通的结果；可我在结果里看到的，还有高考失利留下的执念，本科几年里投入的时间，以及我对身边人的那点愧疚。它像是把一条已经走了很久的路突然截断了。路还在，方向却不再像原来那么确定。",
  "我知道应该怎么安慰自己。一次结果不能概括一个人，努力也不会因为没有换来预期的结果就全部失效。这些话我都说得出来。有时候我也确实相信它们。只是到了晚上，或者看到网上那些关于升学和职业的经验时，我还是会把这件事重新算成一次失败。",
  "网上的经验很容易让人产生一种错觉：人生好像有几条已经被验证过的路线。什么时候该取得什么结果，应该去什么学校，怎样积累能力，下一步又该走到哪里。那些文章大多只讲走通的部分，于是偏离路线的人很难从中看见自己。他会开始担心，这次偏离是不是会在未来某个更重要的时刻，变成一处无法补救的败笔。",
  "我也有过这种担心。我怀疑自己过去做的那些事到底有没有用，怀疑所谓的努力是否真的在改变什么。后来我发现，我真正想问的也许不是“这件事究竟算成功还是失败”，而是：一件事的成败，究竟由谁来决定？",
  {
    "h": "站在哪里看山"
  },
  "假设一个人在街区开了一家咖啡店。怎样才算成功？",
  "他可以想把它做成百年老字号，也可以趁着它成为爆款时赚够钱离开；可以把它经营成一个独立品牌，也可以只是希望自己拥有一间愿意每天走进去工作的店。甚至，他只要真的把这家店开起来，就已经觉得目标完成了。",
  "这些答案都说得通。店还是那家店，站在不同位置的人看见的却不是同一座山。苏轼说“横看成岭侧成峰，远近高低各不同”，大概就是这个意思。",
  "我过去的问题，是把其中一个位置当成了唯一的位置。推免的结果、学校的名字、别人眼里那条看起来更稳妥的路，被我拼成了一把尺子。结果没有落在尺子规定的位置上，结论也就跟着出来了：失败，说明过去的努力不够有效。（虽然客观理性来讲这次的确是一个值得反思的机会，不只是结果本身，需要反思的是这个过程遇到的种种问题）",
  "我不想因为这次经历，就假装外部评价不重要。结果会带来真实的机会差别，学校也确实会影响一个人的起点。不喜欢一套标准，不代表它就不存在。只是我开始觉得，评价一个人的尺子不应该只有一把。至少，那把用来判断我是否正在变好的尺子，不能完全交给别人保管。",
  "这不是给自己设计一场永远不会输的游戏。它要求我先回答一个更困难的问题：我究竟想成为怎样的人？我愿意用什么来判断自己正在靠近他，还是正在离开他？",
  {
    "h": "带着错误读一本书"
  },
  "今年暑假做独立产品时，我列过很详细的开发计划：需求、功能、任务都有了，但哪些值得先做，我其实没有想清楚。很多和产品核心用途关系不大的想法也被放进了计划。事情越列越多，取舍反而越来越难。",
  "回头看，我当时很容易被一个功能吸引，却不太会判断它的价值。看到别的产品里有一个不错的设计，就想把它带回自己的产品；想到一种可能的用法，就觉得值得为它增加一个功能。至于用户在什么情况下需要它，没有它会遇到什么困难，我并没有同样认真地追问。",
  "这些问题会在开发里变得具体。一个未经验证的想法进入计划之后，就需要团队花时间理解、设计和实现，还可能留下后续的维护成本。等到发现它和当前最重要的问题关系不大时，已经很难轻轻松松地把它拿掉。我做了不少事，却没有充分的理由说明，为什么应该先做这些。",
  "后来我们开始调整做法，先讨论一个版本里哪些需求最值得投入，再由每个人负责其中一项需求的定义、开发和验证。这让我有了一个更具体的判断方向：一个功能能否帮助用户完成原本难以完成的事？它的缺失会不会让用户放弃使用？这些问题至少比“这个功能看起来不错”更值得花时间讨论。不过，有了问题，并不代表我已经知道怎样找到可靠的答案。",
  "所以我想带着这些经历去读《做对产品》。我想回头检查自己曾经坚持过的功能：当时认为它有价值，依据究竟是什么？哪些依据来自用户，哪些只是我的设想？如果重新做一次，能不能先用更小的尝试确认用户是否需要它，再决定要不要投入开发？",
  "这里的“带着错误去读”，对我来说，是把那些做过、犹豫过、判断错过的决定重新拿出来。读到一个方法时，我能想到它对应哪一次讨论、哪一项功能，也能追问它是否真的解释了当时的问题。它未必适用于我的处境，但这种对照能让我看见，自己的判断还缺少什么。",
  "我以前觉得，有了 AI，几乎什么都能学会。它确实让我更快地学会使用工具，把想法做出来。但一个功能做出来之后有没有价值，需要从用户的使用和反馈里判断。我在暑假的实践中碰到了这些问题，现在想借助阅读，把零散的体会整理成下一次做取舍时用得上的方法。",
  {
    "h": "知和行之间"
  },
  "我以前很容易把“知”和“行”分成前后两个阶段：先学，等准备好了再做；或者先做，做完之后再总结。但真正做产品时，它们很少这样整齐地排列。",
  "做一个低成本的原型，往往要先行动。没有接触用户之前，很多需求只能停留在猜测里。原型做出来，看到用户卡在什么地方，才知道接下来该问什么、该读什么。",
  "但一个会改变产品核心结构的 feature，不能只靠不断尝试来推进。它需要先把几个问题想清楚：服务的是谁，解决的是什么问题，什么算完成，哪些东西暂时不做。如果这些问题没有边界，行动越快，留下的负担可能越多。",
  "所以真正困难的不是决定“先知还是先行”，而是判断当下缺的究竟是哪一种知，以及哪一种行能够帮助我得到它。",
  "我希望在研究生阶段获得的，正是这种判断能力。对我来说，它会比发一篇顶刊更深地影响之后的人生。论文可以证明我在某个问题上完成过一次研究，但知和行之间的往返，才决定我遇到下一个问题时能不能重新开始。",
  "我常常觉得自己的思考链条太短。我的思维跳跃，拿到一个问题之后，我能很快在脑中找到几个相关的散点，再把它们拼成一段听起来有逻辑的话。这种速度有时很有用，但它也让我过分依赖最近看过的内容、最近说过的话，以及最近一次检索到的答案。",
  "散点之间能连起来，并不说明它们已经组成了骨架。真正开口之前，我还需要停一下，问自己几件事：这句话是说给谁听的？我想让对方知道什么，或者做什么？对方需要怎样的表达？哪些内容现在不必说？我认为重要的东西，真的和这个问题有关吗？",
  "我在 Agent 身上见过同样的情况。一个 Agent 如果把上一项任务留下的内容直接带进下一项任务，它可能会把最近的记忆误认成当前最重要的事情。人也会这样。我们需要的不是把所有经历都留住，而是在判断之前，暂时把那些过于靠近、过于熟悉的东西放到一边。",
  {
    "h": "把 Agent 的方法用回自己"
  },
  "我曾经厌恶学校，是因为学校经常用一套固定的评价体系来处理复杂的人。成绩、排名、论文和录取结果都很方便比较，久而久之，我们甚至会主动用这几项指标解释自己。",
  "我现在想借鉴的，并不是把人当成 Agent，也不是把生活写成一份可以自动执行的脚本。真正值得借鉴的是，我在使用 Agent 时反复做的几件事：先把目标说清楚，给出行动边界，说明什么算完成，留下反馈的位置，再根据结果修改下一轮的提示词。",
  "这些步骤之所以有用，是因为 Agent 不会自动知道我心里那个模糊的“做得更好”究竟是什么意思。目标写得含混，它就可能在错误的方向上高效工作；没有边界，它就会不断增加内容；没有停止条件，它就会把继续生成误认为完成任务。写 goal 的过程，实际上是在逼我把愿望变成一个可以检查的方向。",
  "人也常常缺少这样的检查。我们知道自己想变好，却没有说清楚“好”是什么；遇到一个结果，就临时拿它来替自己下判断；读到一种新的成功经验，又立刻把它加入自己的标准。于是，评价体系一直在影响行动，却从来没有被认真写出来、看回去、改一遍。",
  "所以我想把这套用来驱动 Agent 的方法反过来用在自己身上。系统提示词负责提醒我应该遵守什么原则，goal 负责说明当前这一阶段要把力气用到哪里，评价标准则用来检查行动是否真的在把我带向那里。三者不是三份独立的文档，而是一套帮助我持续校正自己的工具。",
  "这份提示词可以短一些，像阿西莫夫笔下的机器人三定律。先写几条真正会影响行动的规则，例如：",
  {
    "q": "不把一次结果当成全部判断。"
  },
  {
    "q": "用行动获得反馈，再用阅读和复盘解释反馈。"
  },
  {
    "q": "不让最近接触的信息直接替我做决定。"
  },
  {
    "q": "继续增加之前，先确认目标、价值和停止条件。"
  },
  "这份提示词不会一次写完。也许以后突然某一天我会觉得：一个更好的自己还应该能够规范作息，能够及时回应别人交付的信任，能够在表达之前先替对方省下一点信息带宽。那时，我可以把新的理解加进去。",
  "但我不想把它变成一份越来越长的规训清单。一个标准值得留下，是因为它会改变我的行动，并且让我更靠近自己想成为的人；如果它只是让我在纸面上显得更完整，或者让焦虑找到一个新的出口，就没有必要加入。",
  "日子过得太顺时，也需要小心。顺利很容易让人高估自己，把运气误认成能力。刚发生的经历通常带着最强的情绪，却不一定适合马上写进长期判断。我想先把经历放一放，把从中得到的经验留下来，再等新的知识和下一次行动去检验它。",
  "经历需要悬置，经验需要归档，评价体系也应该允许更新。它要能容纳新的发现，又不能每次都被羞耻、焦虑或一时的兴奋改写。",
  {
    "h": "选择哪些声音进入自己"
  },
  "我以前把信息过载理解成“信息太多”。现在觉得，更麻烦的是人会慢慢失去一个权力：决定什么信息在什么时候进入自己的判断。",
  "网上有很多看起来只有一个方向的路。它们告诉你什么年龄应该拿到什么结果，什么学校对应什么未来，怎样的选择才算理性，哪些偏离会变成一生的遗憾。这些经验不一定错误，但它们不应该不经筛选就获得评价我的资格。",
  "我需要的不是一个收集所有信息的地方，而是一道入口。我得知道哪些声音值得听，哪些只是在重复别人走过的路；也得知道什么时候应该离开屏幕，回到自己的行动里。",
  "我仍然希望自己有一天能成为一个可以改变规则的人。现在这句话对我来说还很大，所以我只能先把它说得具体一些：我希望自己逐渐拥有足够可靠的判断，不再只是网上经验主义的囚徒；我希望能够参与决定什么值得被评价，什么值得继续，什么应该放下。",
  "这还不是我已经拥有的能力，只是我愿意长期练习的方向。",
  {
    "h": "还没有写完的提示词"
  },
  "我还不能说自己已经接受了那次推免结果。它有时仍然会被我理解成失败，仍然会勾起高考失利留下的记忆，也仍然会让我怀疑过去的努力究竟有没有用。",
  "但我开始明白，接受结果并不是唯一的任务。我还需要回头看看，那个替我解释结果的系统是怎样工作的。",
  "我想给自己写一份系统提示词。它不需要很长，也不会一次完成。下一次我又被结果、经验和信息推着向前时，它至少可以让我停下来问三个问题：",
  "我正在成为谁？",
  "我用什么标准判断自己？",
  "这次行动，会把我带向哪里？",
  "这份提示词的下一版，就从《做对产品》开始。我会带着已经犯过的错误去读它，再带着新的理解回到行动里。如果新的行动又暴露出新的问题，就继续修改它。",
  "我还没有完成对自己的设计。现在只是开始承认，这件事不能完全交给别人替我完成。"
]);

const bodyJa = Object.freeze([
  "私は、行けると信じていたあの学校に行けなかった。",
  "その結果が出てから、しばらくのあいだ私はそれを「落選」と呼びたくなかった。その言葉は軽すぎて、普通の結果のように聞こえたからだ。私がそこに見ていたのは、高考に失敗した記憶から残った執着、大学の数年間に費やした時間、そして周囲の人たちに対する申し訳なさだった。長いあいだ歩いてきた道が、突然途中で切れたようだった。道そのものは残っている。でも、以前のように行き先を確信できなくなった。",
  "自分を慰める言葉なら知っていた。一つの結果だけで人間のすべてが決まるわけではない。期待した結果が得られなかったからといって、努力のすべてが無意味になるわけでもない。そう言うことはできた。ときには、本当にそう思えた。それでも夜になると、あるいは進学や仕事についての経験談をネットで読むと、私はこの出来事をもう一度「失敗」として数え直していた。",
  "ネット上の経験談は、人生にはすでに検証された道がいくつかあるような錯覚をつくる。何歳までにどんな結果を出すべきか、どんな学校に行くべきか、どの順番で能力を積み上げるべきか。その先には次の段階がある。多くの記事が語るのは、うまくいった道だけだ。そこから外れた人は、自分の姿を見つけにくい。そして、このずれがいつか、取り返しのつかない傷として現れるのではないかと不安になる。",
  "私もそうだった。これまでやってきたことに本当に意味があったのか、努力は何かを変えていたのか、と疑った。やがて、私が本当に知りたかったのは、この出来事が成功だったのか失敗だったのかではないと気づいた。成功と失敗を決めるのは、いったい誰なのか。",
  {
    "h": "どこから山を見るか"
  },
  "街角で一軒のコーヒー店を開いた人がいるとする。何をもって成功と呼ぶだろう。",
  "百年続く老舗にしたい人もいる。流行の店にして、十分に稼いだら離れる人もいる。自分だけのブランドをつくりたい人もいる。ただ毎日、自分が進んで働きに行ける店を持ちたい人もいる。店を開けたこと自体を目標の達成と考えてもいい。",
  "どの答えもおかしくない。同じ店でも、立つ場所が変われば見える山が変わる。蘇軾は、横から見れば峰になり、遠近や高さによって見え方が変わる、と書いた。たぶん、そういうことだ。",
  "私の問題は、そのうちの一つの場所を唯一の場所だと思っていたことだった。大学院への推薦選考の結果、学校の名前、他人から見てより確かな道。それらを一本の物差しにしていた。結果がその物差しの位置に届かなければ、結論も自動的に決まった。失敗だ。過去の努力は十分に有効ではなかった。",
  "だからといって、外からの評価が重要ではないふりをしたいわけではない。結果によって得られる機会は現実に変わるし、学校は出発点にも影響する。ある基準が嫌いでも、その基準が消えるわけではない。ただ、自分を測る物差しは一つでなくてもいいと思い始めた。少なくとも、自分がよくなっているかを判断する物差しまで、他人に預けたままにはしたくない。",
  "これは、絶対に負けないゲームを自分のためにつくるという話ではない。先に、もっと難しい問いに答えなければならない。私はどんな人間になりたいのか。その人に近づいているのか、遠ざかっているのかを、何によって判断するのか。",
  {
    "h": "間違いを抱えて本を読む"
  },
  "この夏、独立プロダクトを開発していたとき、私は細かな開発計画を立てた。要件も機能もタスクも並べていたが、何から取り組むべきかは、十分に考えられていなかった。プロダクトの主な用途とはあまり関係のないアイデアも、計画に入っていた。やることが増えるほど、何を優先し、何を見送るかを決めるのが難しくなった。",
  "振り返ると、私は機能の魅力にはすぐ引かれる一方で、その価値を判断するのは苦手だった。他のプロダクトでよい設計を見かければ、自分たちのプロダクトにも取り入れたくなった。使い方を一つ思いつけば、そのために機能を追加する価値があると思った。ユーザーがどんな場面で必要とするのか、それがなければ何に困るのかは、同じようには掘り下げていなかった。",
  "こうした判断の不足は、開発に入ると具体的な負担になった。未検証のアイデアでも、計画に入れば、チームは理解し、設計し、実装するために時間を使う。その後の保守作業が生じることもある。いま最も重要な問題とはあまり関係がないと気づくころには、簡単に取り除けなくなっていた。私は多くの仕事をしたが、なぜその仕事を先にするべきだったのか、十分な理由を説明できなかった。",
  "その後、私たちは進め方を変え始めた。まず、そのバージョンでどのニーズに力を注ぐべきかを話し合い、一人ひとりが一つのニーズの定義から開発、検証までを担当するようにした。そこで、判断のための問いも具体的になった。この機能は、ユーザーがそれまで難しいと感じていたことをできるようにするだろうか。この機能がなければ、ユーザーは使うのをやめてしまうだろうか。少なくとも「この機能はよさそうだ」より、時間をかけて話し合う価値がある。ただ、問いを持てたからといって、信頼できる答えの見つけ方までわかったわけではなかった。",
  "だから、こうした経験を踏まえて『The Right It』を読みたい。以前、自分が必要だと主張した機能を、もう一度検討したい。その価値を信じた根拠は何だったのか。どの根拠がユーザーから得られたもので、どれが自分の想定にすぎなかったのか。やり直すなら、開発に取り組む前に、もっと小さな試みでユーザーが必要としているかを確かめられないだろうか。",
  "私にとって「間違いを抱えて読む」とは、実際に下した判断、迷った判断、誤った判断を、もう一度取り出すことだ。本で一つの方法に出会ったとき、あの議論やあの機能に結びつけて考え、その方法が当時の問題を本当に説明しているかを問い直せる。自分の状況には当てはまらないかもしれない。それでも、照らし合わせることで、自分の判断に何が足りなかったかが見えてくる。",
  "以前は、AI があればほとんど何でも学べると思っていた。確かに、ツールを覚え、アイデアを形にするまでの時間は短くなった。でも、完成した機能に価値があるかどうかは、ユーザーの使い方とフィードバックから判断する必要がある。夏の実践で、私はこうした問題にぶつかった。いまは読書を通じて、断片的な気づきを、次に取捨選択するときに使える方法へ整理したい。",
  {
    "h": "知ることと行うことのあいだ"
  },
  "私は以前、「知ること」と「行うこと」を前後二つの段階に分けていた。先に学び、準備ができてから動く。あるいは先に動き、あとで経験をまとめる。でも実際にプロダクトをつくっていると、そんなにきれいには並ばない。",
  "低コストのプロトタイプは、まず動いてみる必要がある。ユーザーに触れる前は、多くのニーズが推測にとどまる。プロトタイプをつくり、ユーザーがどこでつまずくかを見て、初めて次に何を聞き、何を読み、何を変えるべきかがわかる。",
  "一方で、プロダクトの核心構造を変える feature は、試行を繰り返すだけでは進められない。誰のためのものか。どんな問題を解くのか。何をもって完成とするのか。今回のバージョンでは何をしないのか。こうしたことを先に決める必要がある。境界がなければ、速く動くほど負担を残すことになる。",
  "難しいのは、知ることを先にするか、行うことを先にするかを決めることではない。いま不足しているのはどんな知識なのか、そしてそれを得るためにどんな行動が必要なのかを判断することだ。",
  "これが、私が大学院で身につけたい能力だ。私にとっては、トップジャーナルに論文を一本発表することよりも、その後の人生に深く影響する。論文は、ある一つの研究を完了したことを示せる。でも、知ることと行うことの往復があるからこそ、次の問題に出会ったとき、もう一度始められる。",
  "私は、自分の思考の連鎖が短いとよく感じる。思考が跳びやすい。問いを渡されると、頭の中から関連する点をすぐにいくつか探し出し、それらをつないで、論理があるように聞こえる文章をつくれる。この速さは役に立つこともある。でも同時に、最近読んだもの、最近話したこと、直近の検索結果に頼りすぎる原因にもなる。",
  "点と点をつなげられることは、そこに骨格ができたという意味ではない。話す前に一度止まり、こう問い直す必要がある。この言葉は誰に向けたものか。相手に何を知ってほしいのか、何をしてほしいのか。どんな伝え方が必要なのか。いま言わなくてもよいことは何か。自分が面白いと思っていることは、本当にこの問いに関係しているのか。",
  "Agent にも同じ問題がある。前のタスクの残りをそのまま次のタスクに持ち込むと、Agent は最近の記憶を現在の課題で最も重要なものだと誤解するかもしれない。人も同じだ。すべての経験を常に有効にしておく必要はない。判断する前に、近すぎるもの、慣れすぎたものをいったん横に置く必要がある。",
  {
    "h": "Agent の方法を自分に使い返す"
  },
  "私はかつて、学校に反発していた。学校は複雑な人間を、固定された評価制度で扱うことが多いからだ。成績、順位、論文、合格結果は比較しやすい。いつの間にか、私たちはその指標を使って自分自身を説明するようになる。",
  "いま借りたいのは、人間を Agent とみなす考えでも、人生を自動実行できるスクリプトにすることでもない。Agent と協働するときに、私が繰り返し行っていることだ。目標を明確にする。行動の境界を決める。何をもって完了とするかを書く。フィードバックの場所を残す。結果を見て、次の prompt を修正する。",
  "これらの手順が役に立つのは、Agent が私の頭の中にある「もっとよくやる」という曖昧な言葉の意味を、自動的には知れないからだ。目標が曖昧なら、間違った方向へ効率よく進むかもしれない。境界がなければ、内容を増やし続ける。停止条件がなければ、生成を続けることを完了だと思い込む。goal を書くことは、曖昧な願いを、確認できる方向へ変える作業になる。",
  "人も同じ確認を怠りやすい。よくなりたいとは思っているのに、「よい」とは何かを言葉にしていない。起きたばかりの結果を使って、自分に判決を下す。他人の成功談を読むと、それをすぐ自分の基準に加える。評価制度は行動を動かし続けているのに、私たちはそれを一度も書き出さず、振り返らず、修正しない。",
  "だから私は、Agent を動かすために使っている方法を、自分自身に使い返したい。システムプロンプトは、守るべき原則を思い出させる。goal は、いまの段階でどこに力を使うかを示す。評価基準は、実際の行動がそこへ向かっているかを確かめる。この三つは別々の文書ではない。自分の方向を継続的に修正するための一組の道具だ。",
  "このプロンプトは短くていい。アシモフのロボット三原則のように、まずは本当に行動を変える規則をいくつか書けばいい。",
  {
    "q": "一つの結果だけで、すべてを判断しない。"
  },
  {
    "q": "行動からフィードバックを得て、読書と振り返りによって解釈する。"
  },
  {
    "q": "直近で触れた情報に、判断を代行させない。"
  },
  {
    "q": "何かを追加する前に、目標、価値、停止条件を確かめる。"
  },
  "このプロンプトは一度で完成しない。いつか、よりよい自分には生活リズムを整える力も必要だと思うかもしれない。他人が寄せてくれた信頼に、もっと早く応えられること。話す前に、相手の情報処理の負担を少し減らせること。そう思ったら、その理解を加えればいい。",
  "ただし、プロンプトを規則が増え続けるリストにはしたくない。ある基準を残す価値があるのは、それが行動を変え、なりたい自分に近づけるからだ。紙の上で自分を完全に見せるためだけのものや、不安の新しい出口になるだけのものなら、加えなくていい。",
  "順調な時期にも注意が必要だ。うまくいっていると、人は自分を過大評価し、運を能力だと取り違える。起きたばかりの経験は感情が強い。でも、すぐに長期的な判断へ変えてよいとは限らない。いったん経験を置き、そこから得たものを残し、新しい知識と次の行動で検証する。",
  "経験はいったん保留し、教訓は記録し、評価制度は更新できるようにしておく。新しい発見を受け入れながら、羞恥や不安、一時的な興奮のたびに書き換えられないものにする。",
  {
    "h": "どの声を自分の中に入れるか"
  },
  "以前の私は、情報過多を「情報が多すぎること」だと思っていた。いまは、もっと深い問題があると思う。何の情報を、いつ、自分の判断の中へ入れるかを決める力を少しずつ失っていくことだ。",
  "ネットには、一方向にしか進まないように見える道がたくさんある。何歳までにどんな結果を出すべきか、どの学校がどんな未来につながるか、どの選択が合理的か、どのずれが一生の後悔になるか。そうした経験が間違っているとは限らない。でも、吟味されないまま、私を評価する権利を持つべきではない。",
  "必要なのは、すべての情報を集める場所ではない。入口だ。どの声を聞く価値があるのか、どの声が他人の通った道を繰り返しているだけなのかを知りたい。そして、いつ画面から離れて、自分の行動に戻るべきかも知りたい。",
  "いつか、ルールそのものを変えられる人になりたいと思っている。その言葉はまだ私には大きすぎる。だから、いまは具体的に言うしかない。ネット上の経験主義の囚人ではない、十分に信頼できる判断力を持ちたい。何を評価する価値があるのか、何を続ける価値があるのか、何を手放すべきなのかを、自分も決められるようになりたい。",
  "これは、すでに手に入れた能力ではない。長い時間をかけて練習したい方向だ。",
  {
    "h": "まだ書き終わっていないプロンプト"
  },
  "あの大学院への推薦選考の結果を、もう受け入れたとは言えない。いまでもそれを失敗として読むことがある。高考に失敗した記憶も戻ってくる。そして、過去の努力に本当に意味があったのかと、まだ考えてしまう。",
  "でも、結果を受け入れることだけが課題ではないと、少しずつわかってきた。その結果を私に説明したシステムが、どのように動いているのかも見直さなければならない。",
  "自分のためにシステムプロンプトを書きたい。長くなくていい。一度で完成しなくていい。次に結果や経験や情報に押されて前へ進むとき、少なくとも立ち止まって、三つの問いを思い出せるようにしたい。",
  "私は何になろうとしているのか。",
  "私はどんな基準で自分を判断しているのか。",
  "この行動は、私をどこへ連れていくのか。",
  "このプロンプトの次の版は、『The Right It』を読むところから始まる。すでに犯した間違いを抱えて読み、新しい理解を持って行動に戻る。そして、次の行動が新しい問題を見せたら、またプロンプトを修正する。",
  "私はまだ、自分自身の設計を終えていない。ただ、この仕事をすべて他人に任せることはできないのだと、ようやく認め始めた。"
]);

export const designYourself = Object.freeze({
  slug: 'design-yourself',
  date: '2026-10-05',
  edited: '2026-10-05',
  tag: 'NOTES',
  title: L(
    'Design Yourself',
    '为自己设计自己',
    '自分自身を設計する',
  ),
  body: Object.freeze({ en: bodyEn, 'zh-CN': bodyZh, ja: bodyJa }),
  notes: L(
    "A personal essay on failure, product practice, and using the methods that guide Agents to guide one's own growth.",
    '一篇关于失意、产品实践，以及如何把驱动 Agent 的方法反过来用于自我提升的个人随笔。',
    '失意、プロダクトの実践、そして Agent を導く方法を自分自身の成長に使い返すことについての随筆。',
  ),
});
