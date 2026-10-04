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
  "This summer, I spent much of my time on an independent product. Looking back, the experience left me with more than the fact that I had made a product. It left me with a number of very specific mistakes.",
  "I went too far in feature design. Many ideas had little to do with the product’s core loop, but I did not move them outside the product or make them removable modules. Every new idea felt like a permanent commitment.",
  "I did the same thing in meetings. I poured out things I had not yet thought through, assuming that laying out every possibility would make the discussion more complete. Instead, the vocabulary grew, the actual decisions became less clear, and a meeting that could have ended in half an hour became longer.",
  "I also brought other products and case studies back into my own product. This product had good navigation; that one had attractive cards; another had a layout that seemed better for work. I wrote them down and placed them one by one into Flow Canvas. There was more in the product, but it began to look like an ordinary canvas tool. Eventually I realized that I had not found a better answer. I had been assembling answers other people had already given.",
  "Agents made this tendency more obvious. Once, to assemble features more quickly, I opened six windows at the same time. I calculated the speed of generation, but not the time needed to check the outputs. The number of windows could keep growing; the person responsible for review was still just me. The output increased, but judgment did not become faster. I had to reorganize much of it myself.",
  "I was busy, and I had put in real time. But being busy and moving a product forward are not the same thing. I spent time, expressive energy, and tokens, while the thing users actually needed did not become any clearer.",
  "This made me reconsider what experience means. I used to believe that, with AI, almost anything could be learned. Now I see the premise I had overlooked: many of the things I called “anything” can already be learned through training and imitation. AI mainly saves me the time of watching videos, searching for material, and trying tools. It does not make the judgment for me.",
  "I also used to overestimate experience. I thought that if I did enough things, judgment would appear by itself. But unexamined experience may simply be an archive of mistakes. A method that works by accident may fail the next time. A failure that has not been explained cannot do much to change me.",
  "So I am going to read The Right It. I want to read it with these mistakes from the summer in mind: how should a product decide whether a problem is worth solving? Where should the boundary of a feature be drawn? How should product, design, and software engineering work together? How should development strategy and product philosophy support each other?",
  "I do not want to turn the book into another set of correct answers. A more useful way to read it may be to use its methods to look back at my own decisions. What did I miss? Why did I make that judgment? Was information missing, or had I failed to define the problem? Should I change the action next time, or the standard I use to judge the action?",
  "When I read with my mistakes, I am not only reading someone else’s experience. The actions that have already happened get another explanation.",
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
  "今年暑假，我把很多时间花在了一个独立产品上。现在回头看，那段经历留下的并不只有“做过一个产品”这件事，还有一些很具体的错误。",
  "我在 feature 设计上走得太远。很多想法和产品的核心 loop 关系并不紧密，我却没有及时把它们放到产品之外，也没有把它们做成可以随时拿掉的模块。每出现一个新点子，我都像是在给产品增加一项永久的承诺。",
  "开会时也是这样。我把还没有想清楚的东西一股脑说出来，以为把所有可能性摊开，讨论就会更充分。结果是术语越来越多，真正需要做的判断越来越模糊，一场本来半小时可以结束的会议被拖得更长。",
  "我还把别的产品和案例带回了自己的产品。这个产品的导航不错，那个产品的卡片好看，另一个产品的布局似乎更适合工作。我把它们记下来，再一个个放进 Flow Canvas。东西确实变多了，产品也越来越像一个普通的画布工具。到后来，我才意识到自己并没有找到更好的答案，只是在把别人已经做过的答案重新拼在一起。",
  "Agent 让这种倾向变得更明显。有一次，为了快一点把功能拼起来，我同时开了六个窗口。那时我只计算了生成的速度，没有计算检查这些产出需要多少时间。窗口可以不断增加，负责 review 的人却还是我一个。最后，输出变多了，判断没有变快，其中不少内容还要由我重新整理。",
  "我当时很忙，也确实投入了很多时间。但忙碌和产品向前走并不是一回事。我消耗了时间、表达欲和 token，用户真正需要的东西却没有因此变得更清楚。",
  "这让我重新看待“经验”这件事。我以前相信，有了 AI，几乎什么都可以学会。现在看，这句话里有一个容易被忽略的前提：我说的“任何事情”，很多本来就可以通过培训和模仿掌握。AI 主要替我省下了看视频、找资料和尝试工具的时间，却没有替我完成判断。",
  "我也曾经高估经验的作用，以为做过足够多的事情，判断力就会自然出现。可未经整理的经验可能只是错误的存档。一次偶然有效的做法，下一次未必还有效；一个没有被解释清楚的失败，也很难真正帮助我改变。",
  "所以我准备开始读《做对产品》。我想带着暑假里的这些错误去读它，看看产品该怎样判断一个问题是否值得解决，feature 的边界应该怎样划，产品、设计和软件工程之间怎样合作，开发策略和产品哲学又该怎样互相支撑。",
  "我不想把这本书读成另一套标准答案。更有用的读法，也许是拿书里的方法回头看自己的决定：当时我看漏了什么？我为什么会做出那个判断？这是因为缺少信息，还是因为根本没有把问题定义清楚？下一次应该改变行动，还是改变我用来评价行动的标准？",
  "带着错误去读书，读到的就不只是别人的经验。那些已经发生的行动，会得到一次新的解释。",
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
  "この夏、私は多くの時間を一つの独立プロダクトに使った。振り返ってみると、残ったのは「プロダクトをつくった」という事実だけではない。いくつもの具体的な間違いも残った。",
  "feature の設計で、私は広げすぎた。プロダクトの core loop とほとんど関係のないアイデアも、外に出さず、取り外せるモジュールにもせず、抱え込んだ。新しいアイデアが出るたびに、プロダクトに永久の約束を追加しているようだった。",
  "会議でも同じだった。まだ考え切れていないことまで一度に話した。可能性をすべて並べれば、議論はより充実すると思っていた。実際には、言葉だけが増え、決めるべきことはかえって見えなくなった。三十分で終わるはずの会議も長引いた。",
  "他のプロダクトや事例も、自分のプロダクトに持ち込んだ。このプロダクトのナビゲーションはよい。あのプロダクトのカードはきれいだ。別のプロダクトのレイアウトは仕事に向いていそうだ。そうしたものを書き留め、一つずつ Flow Canvas に入れた。確かに要素は増えた。でもプロダクトは、どこにでもあるキャンバスツールに近づいていった。あとになって、私はよりよい答えを見つけたのではなく、他人がすでに出した答えを組み直していただけだと気づいた。",
  "Agent を使うと、この傾向はさらに目立った。あるとき、機能を早く組み上げるために、六つのウィンドウを同時に開いた。私は生成の速さだけを計算し、出力を確認する時間を計算していなかった。ウィンドウはいくらでも増やせるが、review をする人は一人の私のままだった。出力は増えたが、判断は速くならなかった。最後には、その多くを自分で整理し直した。",
  "私は忙しかったし、時間も本当に使った。でも、忙しいこととプロダクトが前に進むことは同じではない。時間と表現欲と token を消費しても、ユーザーが本当に必要としているものは、少しも明確にならなかった。",
  "この経験から、私は「経験」の見方を変え始めた。AI があれば、ほとんど何でも学べると思っていた。けれど、その「何でも」の多くは、もともと訓練や模倣によって身につけられるものだった。AI が主に省いてくれるのは、動画を見たり、資料を探したり、ツールを試したりする時間だ。判断そのものを代わりにしてくれるわけではない。",
  "私は経験の力も過大評価していた。十分な数のことを経験すれば、判断力は自然に育つと思っていた。けれど、検討されない経験は、間違いを保存しただけの記録にもなる。たまたまうまくいった方法が、次も通用するとは限らない。説明されていない失敗は、私を変える力を持たない。",
  "だから私は、これから『The Right It』を読む。夏に犯した間違いを抱えたまま読むつもりだ。プロダクトは、解く価値のある問題かどうかをどう判断するのか。feature の境界はどこに引くのか。プロダクト、デザイン、ソフトウェアエンジニアリングはどう協力するのか。開発戦略とプロダクトの哲学は、どう支え合うのか。",
  "この本を、別の正解集にしたくはない。もっと役に立つ読み方は、本の方法を使って自分の判断を振り返ることだと思う。あのとき何を見落としていたのか。なぜその判断をしたのか。情報が足りなかったのか、それとも問題の定義自体ができていなかったのか。次に変えるべきなのは行動なのか、それとも行動を評価する基準なのか。",
  "間違いを抱えて読むと、他人の経験を読むだけでは終わらない。すでに起きた行動に、もう一度説明を与えられる。",
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
