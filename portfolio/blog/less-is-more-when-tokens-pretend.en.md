---
title: 'Do Agents Dream of Farnsworth?'
date: 2026-08-13
excerpt: 'After burning through a friend\'s Kimi quota across six parallel windows and finishing nothing, I went back to The Mythical Man-Month. When AI keeps getting closer to a wish-granting machine, what\'s scarce is never compute — it\'s review, judgment, and restraint.'
cover: '/covers/load-bearing.svg'
accent: '#5b6b7c'
tags: ['AI', 'Reflection', 'Engineering']
---

# Prologue

When I read The Mythical Man-Month, something felt familiar. Not the lessons themselves — "adding manpower to a late software project makes it later" is a sentence I've heard so many times my ears are calloused. What felt familiar was the foolishness of my own. In 1975, Brooks wrote that tasks are not arbitrarily partitionable, that the "man-month" is a myth: adding people to an already-late project only makes it later. Assign nine women, and no child is born in a month.

Fifty years on, we invented a new unit: the token. After Tibo went viral, "burning tokens" became the yardstick of effort. The community invented the "sprint before the reset"; people post the million tokens they burned in a day. Saving tokens started to feel like losing.

Two eras, half a century apart, wrong in the same place. In front of AI, humans pretend to work in two ways: **taking consumption as output, and taking wishes as work.** It isn't that we never read the book — it's that we dressed it in a new outfit and committed the same sin again.

# Opening every window equals opening none

I did exactly this recently. A very small project — to assemble features fast, I opened six parallel Agent windows at once.

Six is a number that looks hard at work. I thought I was parallelizing — like shoving six threads into six cores. But a person is not a machine; a person's review has only one thread.

There was a more practical reason for six. Around then, a friend said he had a Kimi API everyone could use. Free quota — why not use it? I translated "why not use it" directly into "open six windows." The tokens burned frighteningly fast — fast enough that I briefly thought something was broken — and the thing I meant to build was nowhere near done.

Six outputs piled up on my desktop, and I read them one by one. The slower I read, the higher the pile grew; the higher the pile, the more anxious I got; the more anxious I got, the less I dared rely on them; the less I dared rely on them, the more I rewrote by hand. In the end, the output of those six windows was zero. Not six ones — zero.

I'd thought parallel was a way to save time. But the illusion of saving time comes from leaving out the cost of review. You can open six windows; the person reviewing is still just me — a constant, one that doesn't grow linearly with the window count. Brooks said adding people makes things slower because communication cost grows as n(n−1)/2. With Agents, communication cost is swapped for review cost. And review is the constant that never moves.

# It is still a wish machine

But six windows isn't just "no time to review." It says something sideways about the default way many people see AI: it's still a wish machine. Worse, some want a wish machine that grants wishes automatically while you sleep — you stand before it, make a wish, and the wish comes true. As if it stands there, and the rest is its business.

This isn't entirely an illusion. Models are getting stronger; AI really is becoming more like a wish machine. Many so-called award-winning hackathon projects are no more than brute-force AI results. But between "more and more like" and "actually is" sits one thing: responsibility.

Wishing requires no accountability; review does. If you're only wishing, it doesn't matter how many windows you open. When you're responsible for a complex system, the responsible one is just you — and that is exactly where parallelism cannot save you.

So the point of The Mythical Man-Month here is not operational advice like "open fewer windows." What it's really saying: when we want to take on more responsibility inside a complex system, AI has not become the silver bullet for traditional software-engineering problems. It merely converts complexity into a cheaper form and hands it back to you intact — into review. A silver bullet is a silver bullet because it kills complexity in one shot; AI only changes the shape of complexity, not its weight.

Later I realized this lesson was never really "don't open six windows." What drags a person into the tar pit is never the extra windows. It's the trust you place in AI as a wish machine — the trust in "more" itself.

# Split "good" in two: quality, and ease of review

So when is a token well spent? I gave myself a ruler: **with as few tokens and as little time as possible, deliver a result that is both good and easy to review.**

I split "good" into two halves on purpose: high quality, **and** easy to review.

Most people only count the first half. But a "high-quality yet hard-to-review" result is actually inefficient — it spends the most expensive resource, human attention, on re-understanding. Generation is cheap; understanding is expensive. Producing is cheap; accepting is expensive.

So "easy to review" is not a bonus — it is the efficiency itself. Follow this ruler and the methodology grows on its own: hold one or two windows, review what the AI generates strictly. Fewer windows, fewer tokens, clear review — that is how you truly own the project, and that is where efficiency comes from.

# Burning for burning's sake: manufactured effort

If this were just one personal failure, it wouldn't be worth writing. What worries me is that this failure is turning into a culture.

Burning for burning's sake — I suspect at least three layers beneath it.

The first layer is performative. Token count became a visible gauge of effort. Some models, on a single instruction, automatically run a dozen rounds and burn five hours of quota in two minutes — the more you burn, the more invested you look. It's a new social currency. Once a boss bragged "my team has two hundred people"; today people post "I burned five million tokens today." The digits change; the vanity doesn't.

The second layer is incentive distortion. "Saving is a net loss" — quota resets make conserving tokens a pure loss, while burning out might catch another reset. So for the individual, burning out is a rational strategy. It's not that people are stupid; it's that the incentive system rewards waste. When rationality itself is twisted, waste becomes rational.

The third layer is a less charitable guess: the platform may welcome it. The "cyber godfather" persona of Tibo — every reset is a news event, a community topic, a spike of traffic. It turns "quota" into a product memory and "burning tokens" into a habit. I write this layer as a guess, not a conclusion. But a guess is still an observation: a commercial company doing charity for free must have a reason.

These three layers don't sit side by side; they feed each other. The platform manufactures the incentive, the incentive breeds the culture of "burning equals effort," and the culture in turn fuels the platform's growth. So burning for burning's sake is not an individual moral problem — it is manufactured by structure. In the face of a problem manufactured by structure, blaming the individual is cheap.

# When tokens become a per-person allowance

Why did I open six windows that day? Because in that moment tokens were free — the API came from a friend. People don't cherish free resources. That sentence is older than dirt, but in the AI age it carries new weight: because tokens will not stay free forever.

I suspect that soon, companies will hand out token allowances to each employee by headcount. The allowance is finite; use it up and it's gone. When that day comes, the problem changes: no one can burn through their tokens, produce nothing, and then go ask the company to expand the quota. Not that asking is forbidden — it's that the premise changes: **before you apply for an expanded quota, you must first deliver enough value to support the trust that quota asks for.**

An allowance is not a budget; an allowance is collateral for trust. How much you get depends on how much value you delivered last time; the value you delivered last time is the credit for your next application. In 1975, managers kept accounts by headcount; in 2026, companies keep accounts by token. But the ledger has always been written in trust.

# The first version is restrained by ignorance; the second indulges in understanding

Burning tokens is the resource side. The mechanism side is the other — Skills piling up.

In The Mythical Man-Month, Brooks has a chapter called "Second-System Effect": a designer's second system is the most dangerous. The first version is restrained because you don't yet understand; the second version holds a stomach full of features you wanted to add, finally gets the chance to stuff them all in, and over-designs. Let a Skill system grow large enough, and it becomes a tar pit — you've already invested so much that you can't get out.

AI workflows are exactly the same. I collected a lot of PPT-making Skills — after "understanding" the mechanism, this one might be useful, that one might be useful, so I took them all in. But looking back, the ones I actually use often are maybe one or two — and they happen to be the ones collected before I understood, collected because I genuinely needed them. The later batch, collected after I understood, is mostly unused.

The cost of an unused Skill isn't that it "lies around." Every session it still gets loaded into the context — the moment of collecting is free, but from then on, each conversation pays for it in precious context space. It reminds me of that essay, Sediment and Seed: the value of memory lies not in remembering more, but in whether it can change future decisions. An unused Skill is exactly such a memory — it remembers, but it never changes any decision, and just sits there taking up room.

Here is the paradox: the first version is restrained not by self-discipline but by ignorance. Because you don't know what else you could add, you only add what's necessary. Once you understand, understanding itself becomes the burden — you know too many "possible directions," so every direction looks insufficient.

Since then I've set myself one rule: before adding anything, ask — is it load-bearing, or is it decoration? Decoration doesn't stay.

# Less is more is not "less"; it's letting the structure stand up

All of this, in the end, is one sentence: less is more.

Mies van der Rohe's "less is more" has been misread for a long time. People take it to mean "put fewer things in," like emptying a room. But Mies never talked about deletion — he talked about letting the structure stand up on its own. Farnsworth House is almost nothing — a glass box with nearly nothing in it, yet the steel columns, the glass, the proportions are precise to the bone. "God is in the details" and "less is more" were said by the same man. His "less" means stripping away everything that doesn't bear weight, so that what bears weight stands precisely. Less is not emptiness; less is precision.

Conceptual integrity in The Mythical Man-Month is another version of the same sentence: a system should present one idea, not a pile of things. Brooks calls it the most important consideration in system design, guaranteed by the architecture coming from a single mind.

Then there is "no silver bullet": software's complexity splits into essential and accidental; tools can only beat down the accidental part, never the essential. In my previous post I wrote that "a Skill lowers the cost of execution, not the cost of judgment" — the cost of judgment is essential complexity. It cannot be deleted, no matter how many Skills you add.

So less is more is not aesthetics; it is engineering discipline. Every extra non-load-bearing component dilutes that single idea.

# Babel taught us to communicate; Reims taught us to restrain

The Mythical Man-Month uses the Tower of Babel to talk about communication: let the language fall apart, and the tower cannot be built. But I want to talk about another building.

Reims Cathedral, where kings of France were crowned, took nearly a century to build, generation after generation of anonymous masons carrying on. No one drew a master plan in today's sense; no one explained every stone to everyone — yet it is one of the most coherent works of Gothic architecture. The secret is not communication; it's restraint: each mason stays in his own domain of contribution, works in the same structural grammar, and holds back his superfluous inventions.

Babel and Reims teach opposite lessons. Babel says: without communication, you fail. Reims says: when trust and division of labor are clear enough, not communicating is a virtue. In an age anxious to align everything, "holding back some of your own ideas" sounds negative; but in a team that can hand each other trust, with clear domains of contribution, it is precisely positive — it gives the space back to the part that truly belongs to you.

The second-system effect is about a designer who can't hold back his ideas; the masons of Reims prove that the one who holds back is the one who builds.

This also made me rethink conceptual integrity. Brooks says it needs a single mind; Reims says it can also live without that single mind, through a shared grammar. The two statements don't contradict — when everyone internalizes the same grammar and holds their own domain, everyone becomes that single mind. Conceptual integrity doesn't require a hero architect. It can be a structure shared by all, and guarded by all.

# Orthogonality: the ledger of a history of restraint

On the operational level, my stop condition is: when the existence of a Skill or an Agent begins to require me to "explain what it does" rather than "let it work on its own," it's time to delete it. It no longer produces output; it produces a memory burden.

A healthy Skill system, as I understand it: most Skills cover my primary working domain, and the semantics between Skills are as orthogonal as possible.

"Orthogonal" sounds like technical cleanliness, but I want to argue it isn't. Orthogonality is the grand ledger of a history of restraint — every Skill's boundary is a position left by an "idea we held back from adding." When two Skills overlap in meaning, the model has to judge on the spot which one to use; that "on-the-spot judgment" is a symptom of diluted conceptual integrity.

Three signals — take a subtraction when any one appears: review falls behind, output piles up; opening new windows and adding new Skills becomes a habit instead of filling a real gap; the list grows so long I can no longer remember what each one does.

A small orthogonal library covering 90% of my working domain is healthier than a large one covering 10% while hoarding fifty tangential Skills. The former is a structure; the latter is a warehouse.

# Taking back the decision: whether to add, and where

AI is getting cheaper; restraint is getting more expensive. What's scarce has never been compute — it's judgment and attention: a person's capacity to review, and a person's capacity to decide what deserves to continue.

In the previous post I said we must reclaim the power to decide how information enters us. This post, I want to add the second half: reclaim the power to decide "whether to add, and where to add." Information overload and mechanism overload are two stages of the same illness — one stuffs too much in, the other adds too much on.

Less is more has never meant "do nothing." It means: more is only more when it hasn't hit the ceiling. And our ceiling is human.

Mies's walls can be removed — but after you remove them, you have to be able to say why each remaining column is there. Whatever you can't justify is a wall that deserved to come down.

# References and further reading

- The Mythical Man-Month, Fred Brooks, 1975 / 1995. Chapters on the man-month myth, the second-system effect, the Tower of Babel, and no silver bullet.
- Mies van der Rohe, Farnsworth House (1945–1951); "Less is more," "God is in the details."
- Reims Cathedral (Cathédrale Notre-Dame de Reims), coronation church of the kings of France.
- [Sediment and Seed: The Memory Paradox in Agent Engineering](https://kinomotomio.github.io/writing/sediment-and-seed/) — kinomotomio. The value of memory lies not in remembering more, but in whether it can change future decisions; forgetting well matters more than remembering more. The reflection in "The second indulges in understanding" about unused Skills occupying context was triggered by this essay.
- Previous post: [When Information Starts Thinking for Me](/blog/flow-canvas-information-overload)
