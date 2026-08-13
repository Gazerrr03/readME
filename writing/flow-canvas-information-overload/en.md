# When Information Starts Thinking for Me

Published: 2026-08-09
Last edited: 2026-08-13
Tag: 设计

## Prologue

If I remember correctly, it was around August of last year — and I may never forget those days of learning while relying on ChatGPT, because that was when a thought took shape: a multi-branch conversation on a canvas, something that could replace the linear dialogue of the traditional LUI.

So I started building a Flow canvas product.

Along the way I watched AI workflows rise and fade, watched Skills appear, watched multi-agent slowly become the industry's technical orthodoxy. New things kept surfacing one after another, iterating fast enough to make you panicky — and looking back, our thing, just pure LLM API calling, felt increasingly unattractive and increasingly uncool.

Gradually Flow canvas grew less cool in our eyes. Yet I have to admit, I still held a soft spot for that immature idea.

I agonized over it for a long time — a kind of pain I couldn't name. Physiologically and psychologically it never really hurt, and yet it hurt.

I actively sent resumes to big companies, was rejected by Tencent three times, and then let go of my own opportunity by hand — a quiet civil war between my two brains.

I wholesale negated the three years of my undergraduate study, and idealistically believed that as long as I still had creative passion, even dropping out would be fine. To that end I even found myself an excuse to give up the postgraduate recommendation, and called it "being picky".

I swung between believing in myself and doubting myself.

It wasn't until I joined the AdventureX hackathon that I discovered the first layer of "information overload". Coding Agents gave everyone — even those who don't understand coding — the chance to realize an idea, and everyone was talking about making something cool. So what exactly is "cool"? I'd been understanding it in a binary, all-or-nothing way.

But AdventureX didn't give me anxiety; quite the opposite, it re-energized me.

Before that, I wanted too badly to make something cool without understanding what cool really was. I used "looks impressive" as the yardstick, agonized in circles, and kept dressing my behavior in excuses that sounded cool.

Only after the hackathon did I see that making cool things can itself be rock and roll — it doesn't need to be packaged into something grand first.

I talked with many young participants. Some were actively pushing the boundary of what a single person can do with AI. Others weren't treating AI as a showcase of technology at all, but genuinely using it to solve problems in their own lives. Those problems might be tiny — not even worth packaging into a grand product story — but they made some part of someone's life a little smoother.

That made me realize again: "cool" doesn't have to mean piling on more buzzwords, more models, more architectures.

The geeks I admire are the ones willing to contribute cool things to the world: they rethink something everyone takes for granted, sense that it could take another shape, and then personally build the answer and hand it over for others to use. Cool isn't just self-expression; it's an act of giving an idea away.

Flow canvas is exactly such an attempt: a rethinking of the shape of the thinking canvas, and a re-examination of the LUI (Linear User Interface) we've grown used to. It doesn't rush to classify itself as any particular tool; instead it proposes an interaction form first and waits to see what people actually want to do with it.

Of course, there may be no standard answer to this question. At least if you asked me now, I'd say: a product comfortable enough for everyone to interact with, whatever their level of knowledge — one that lets all people use it on equal footing and makes their lives a little more convenient. That, I would say, is what fits my intuition of cool.

## Fishing the discarded paper ball out of the trash

So I picked Flow canvas back up — or rather, I started committing to building it in earnest.

It was while picking up this shelved idea that I realized I was trapped in information overload.

I was excited to take this exam again as my year-younger self; our team joked that it was a "Renaissance".

And as an examinee, I was of course serious. During that period I browsed a lot of products praised on Product Hunt, and looked at many canvas, note-taking, AI workspace, and design tools. Every product had something worth borrowing: this one's navigation felt good, that one's cards were beautiful, another one's layout looked suited to work. I noted them down one by one, brought them back to Flow canvas, and tried to fit them into my own product.

## Trash doesn't have to stay in the trash can; the trash can doesn't have to hold trash

During those days of drafting the new prototype, Flow canvas did look increasingly complete. It had gained a lot of plausible UI and quite a few layouts that seemed to improve the experience.

But I soon noticed it was turning into a very ordinary canvas product rather than the thing I originally wanted to make — like a fledgling, with a magpie's borrow-it-all mindset, pasting the feathers of every prettier bird in the woods onto itself.

I had hoped that when people saw Flow canvas, they wouldn't immediately file it under any category: it's not only for mind maps, and not only for loosely arranging images. It defines just one interaction form: users can connect and create cards. Planning a trip with it is fine, working through a complex architecture is fine, even running a tabletop RPG with friends on it is fine.

But the more cases I dragged in, the more I decided on its behalf what it should look like. That ran against my early idea — back then I'd wondered whether we could introduce GenUI, letting each user grow an interface mode that best fits their own working environment. Each card in a canvas is like a car, and we let users modify it however the road demands.

I thought I was looking for a better answer. It turned out I was just looking for answers others had already given.

## When a "plagiarist" audaciously calls their plagiarism creation

This wasn't the first time I'd run into a problem like this.

I remember the first high-scoring assignment of my college years happened precisely when I didn't yet know how to look at cases. I hadn't assembled a proper research phase, hadn't seriously studied any design master — I stayed at the level of memorizing and imitating their symbols. I also just settled down, started from a vague problem, built a lot of boxes in Rhino, and then kept pushing, pulling, and moving them — really, I outsourced a large part of the responsibility for creation to the tool.

Fortunately I was lucky (I define "luck" as being able to produce beautiful garbage without logic — because even today's Agents have a chance of drawing a good card from even the worst prompt, which means even a garbage prompt can yield a pretty result). The generation process went smoothly and the details kept progressing.

The teacher gave me a high score, and I came to believe I had some kind of design talent.

Looking back, that design certainly doesn't deserve to be romanticized: it was built in a vacuum, and never truly practiced the design principles I only came to understand later. It was more like a lucky exercise with a smooth generation process. But I never made such smooth a design again — that stuck with me.

Because later I learned to do research.

In my observation, design education often places research on a very lofty pedestal: a student is asked to collect cases, organize materials, and analyze conditions before they've even qualitatively framed the problem. Active research is of course a good thing, but it should be built on thinking about a problem from the origin. Otherwise research easily becomes a kind of formalism — we don't look at material to verify our judgment; we treat the material as the judgment itself.

And in behavior, students research because the teacher demands it, produce material whose meaning even they aren't sure of, then feel the work is done and plunge into design.

The same happened to me.

Once I thought I had mastered more design theory, more cases, and a wider search ability, design actually began to hurt. Because I knew too many "possible directions", every direction looked inadequate. I'd keep making options, keep comparing, keep negating in the early phase.

By the time everyone around me had almost finished, I'd force myself late at night, squeezing a few meager — even still mediocre — sparks of creativity out of an exhausted body. In essence that behavior is no different from a prostitute's.

It wasn't that I had no ideas; it was that I let too many other people's ideas into the room before my own had taken shape.

And I'd never truly learned how to express myself: my thinking is divergent and leaping, able to spout many abstract notions like some radio wave from another dimension, yet unable to describe them. This showed in my work — I leaned heavily on plan mode, but most of the time it was only a partial distillation of my thoughts. When pair-programming with AI, I believed the AI only took the slice of context it most needed; but the process was often a black box to me: I couldn't tell whether it had really grasped all my ideas.

## What exactly should fit in that overflowing context pocket

Information overload is not just too much information.

> More precisely, it strips away a person's power to decide when information enters, and in what relationship to the current thinking.

A friend recently shared his blog post "Why Obelisk" with me, and much of it resonated deeply — especially the passage on retrieval: retrieval itself is a judgment about timing, scope, and authority; a slightly off-target memory, or one that simply belongs to another moment, doesn't enter the context neutrally — it competes with current evidence, snatches your attention, and quietly turns an old conclusion into a present constraint.

In a product team, solving information overload sometimes doesn't mean building a more complete knowledge base, nor does it mean everyone participates in every decision.

A person with taste, who has formed a sufficiently clear judgment on something and is willing to deliver a confident result, frees everyone else from spending information bandwidth on it. You can see this in some big Chinese companies too — the future internet industry might converge into two kinds of people: value engineers and optimization engineers.

This is not just reducing entropy in information transfer; it is also delivering trust.

The Almanack of Naval Ravikant also mentions that daring to take risks and owning success or failure in your own name is the only road to outsized returns and autonomy.

"I've already looked at it — this result is good to continue with." The value of that sentence isn't how much information it contains; it's that it carries part of the judgment for others. Without such trust, a team keeps redoing research, re-explaining, re-discussing, and finally traps in information the very things that could have moved forward.

So what truly matters isn't making everyone know more, but letting everyone know: what is already certain enough, and what is still worth doubting.

## Reasoning and analysis, abstract distillation, practical verification

I'm not against research. I'm against letting research think on my behalf before I've formed any problem of my own.

Good research should be an attack on a preliminary judgment. It can help us find blind spots, find counterexamples, calibrate direction, converge an abstract thought into a rational yes/no matrix, and also show us that our problem was never clearly defined. But it shouldn't prescribe what the problem is from the start.

Otherwise a very common design process appears: because someone else has a feature, I must have this feature first; because some style is liked by many, my product should use it too; because a case proved successful, it becomes the starting point of my thinking.

Creation becomes plagiarism.

Plagiarism can indeed let a beginner improve quickly. It offers a path already walked, granting a temporary sense of completion. But it's hard to move someone with a foundation toward excellence. Because what you see is only the symbols of a thing cut into pieces; reassembling the symbols usually leaves you below the height of the source.

A fountain can never rise higher than its source. Let alone the fact that we often don't understand why the source flows the way it does.

"Write Prompts Like Code, or Play Them Like Jazz" quoted a study that felt like being seen through: "individuals get stronger, the collective gets narrower. Everyone writes at their personal best, but their bests look more and more alike." It was about collective convergence in AI-assisted writing, but the more I pondered, the more I felt that people who patch others' cases into their own products are stepping into the same trap.

Still, this isn't a dogma; such things are common among big companies: the market already has Trae, yet there's still room for Codebuddy — backed by rich resources, brute force will do.

But I still want to redefine "learning", because creation and learning are, at some level, the same thing — fundamentally I/O, or in plain words, "the unity of knowing and doing".

Imitating a pattern is only "distillation"; being able to summarize regularities from multiple patterns and apply them is what I'd call "learning".

## A high-dimensional point projects many lines and planes below, but projection is reversible too

I'm increasingly convinced that borrowing itself isn't the problem. The problem is what we borrow.

Many things in the world that look completely different may share the same structure at a more macroscopic level. State machines in game design can help us understand an Agent's task states; signal propagation in mechanical systems can help us think about collaboration between complex tools; the control groups of StarCraft can serve as an analogy for quickly organizing space in a large canvas.

This kind of borrowing isn't moving appearances over; it's discovering relations: what gets organized, what can be called up quickly, how states change, how feedback travels, how a user keeps a sense of direction in a complex system.

Large language models are sometimes very valuable here. They excel at natural language, can cluster many viewpoints, compress long complex texts into clearer structures, and help people find commonalities across domains. But where they truly help isn't in choosing a ready-made style for you — it's in helping you see the similar relationships behind various phenomena.

## When an "ism" becomes something that can be burned onto a disc

In the design circle, we're used to compressing complex phenomena into a few words: minimalism, functionalism, postmodernism. This has great communication value. One word lets people in the same field align context instantly.

But compression always causes loss, and it also builds a wall of understanding — because even someone who doesn't know an ism can touch what lies behind it in a moment of drifting thought, and can even coin a new word to describe it.

At the same time, as we rely on these nouns more and more without tracing their history, problem consciousness, and process of generation, the "ism" begins to become packaging. It stops being a response to reality and becomes a visual label you can call up on demand.

Agents and various Design Skills make this even more obvious. Now we can simply say: "give me an Apple-style website." The system quickly assembles rounded corners, whitespace, typography, frosted glass, and motion, and hands back a design rationale that sounds complete.

This does give many people the ability to make good-looking interfaces. But behind a good-looking interface there's another question: does it truly understand the user? Those who hype front-end Skills in the community, claiming they can make some design in a day, may never ask: why is Apple's design imitable by everyone, and worthy of everyone's recognition?

Even the finest style template usually captures only the form. It can't answer why an error message should appear a few seconds late, why some information should be hidden at this moment, why one action needs to be interrupted while another should stay continuous.

These aren't dogmatic UX rules; they're comprehensive judgments about human attention, cognitive load, emotional change, and bodily habit. They come from experiments, interviews, failures, and repeated correction — they cannot be fully packaged in a Markdown document.

So Skill lowers the cost of execution, not the cost of judgment.

As execution gets cheaper, taste shows more clearly as: where you put your effort, when you stop, what's not worth continuing.

## AI Native advocates going all out, yet also advises against going all out

I later found the same problem in how Agents work.

At the early stage of a project, it's easy to preemptively worry about a lot of things: crank the model's thinking effort to maximum, open plan mode, prepare the context as completely as possible in advance. It's as if we only need to think enough up front, and we'll avoid detours later.

But often, real resistance hasn't appeared, and we've already prepared a lot of information for imagined resistance. The longer the context, the more complex the plan, the more hesitant the action becomes.

Of course, AI-native work isn't low effort. It's more like using the smallest total amount of effort and putting it on the real cutting edge: first form a hypothesis that can move, first verify the most critical part; then, when real resistance appears, upgrade search, planning, models, or tools in a targeted way.

People still need to decide the goal, the value, and the stopping conditions. AI can help us find macroscopic structures, compress information, and offer a few possible directions, but it shouldn't decide for us which direction is worth continuing.

## Taking back the right to decide

Looking back now, I don't think that research-less college design proved any talent of mine. It just showed me that before a person learns to search, they're at least still forced to start from the problem itself.

What really needs to change isn't refusing research from now on, nor refusing borrowing, nor refusing Skill and AI.

It's not letting them start thinking for us before we've formed a problem of our own.

Form a judgment at the origin first, then let the world in; find a direction worth continuing first, then pour in the effort.

> What we need may not be more information, but to reclaim the power to decide how information enters us.

## References and further reading

## Inspirations

[Sediment and Seed: The Memory Paradox in Agent Engineering](https://kinomotomio.github.io/writing/sediment-and-seed/) — kinomotomio. The value of memory lies not in remembering more, but in whether it can change future decisions; forgetting well matters more than remembering more. The section "What exactly should fit in that overflowing context pocket" was largely triggered by it.

[Why Obelisk](https://kinomotomio.github.io/writing/why-obelisk/) — kinomotomio. About taste, context vibe, and "good Skills are excavated from collaborations that already succeeded, not invented in advance" — it helped me distinguish execution cost from judgment cost.

[Write Prompts Like Code, or Play Them Like Jazz](https://mp.weixin.qq.com/s/H0vmaXUVRA7rmDAF_kgZ9A) — WeChat official account. Two styles of human-machine collaboration, PromptOps and PromptJazz: what's truly scarce isn't how to write prompts, but how to pick the right one out of ten candidates.

## Mem0「In Context」series

[Beam Memory Benchmark: Key Findings on 1M Context](https://mem0.ai/blog/what-is-beam-memory-benchmark-the-paper-that-shows-1m-context-window-isnt-enough) (In Context #2) — A 1M-token context window doesn't mean remembering better; the real bottleneck is how information is stored, updated, and used.

[How Memory Works in Claude Code](https://mem0.ai/blog/how-memory-works-in-claude-code) (In Context #4) — A breakdown of Claude Code's memory mechanism: the 200-line index, silent truncation, background extraction; also explains that AGENTS.md is only suited to carrying conventions that rarely change.

[Dream: Background memory consolidation for AI agents](https://mem0.ai/blog/dream-background-memory-consolidation-for-ai-agents) — Mem0's "sleep" for Agents: merge duplicates, mark stale items, distill scattered facts into higher-level memories, and delete nothing directly.

[Beyond AGENTS.md: Shared Memory for Coding Agents Across Services and Repos](https://mem0.ai/blog/beyond-agents.md-shared-memory-for-coding-agents-across-services-and-repos) — AGENTS.md answers "what are the rules here"; shared memory answers "what has changed since the last person looked".

---

Field notes: Field notes: the framing of information overload draws on kinomotomio's "Sediment and Seed" and "Why Obelisk"; the memory figures from the Mem0 "In Context" series; the passage on trust from The Almanack of Naval Ravikant. All citations are linked in the references above.
