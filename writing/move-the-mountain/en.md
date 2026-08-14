# Move the Mountain Elsewhere

Published: 2026-08-15
Tag: AI

## On moving complexity, iterating in small steps, and how I turned team division into an Agent subscription rental business

A mountain is sitting in front of us. Why must we climb over it?

Because it is there? Because we can take a photo on the summit? Or because project-management software will not let us mark the task “done” if we do not?

If this were the old me, I would probably open a document at the foot of the mountain and carefully write down its height, slope, weather, route, risks, and a task breakdown for “making sure everyone reaches the summit by Friday.” Then I would open a coding agent and discuss how to split the mountain into issues that could run in parallel and issues that had to run in sequence.

Today, a friend said something to me:

> Complexity has not disappeared. It has been moved elsewhere.

When I first heard it, it sounded a little like project-management sophistry: instead of climbing the mountain, move it somewhere else. It sounded like evasion, even like wrapping “I have not solved it yet” in “I am reorganizing the problem.”

But the sentence stayed with me. I suddenly realized that a lot of what I had done in the past was not solving complexity at all. I was moving it to another place. Worse, sometimes I did not even know that I had already carried it away.

## I have a habit of drawing the picture first

I am someone who studies design. One of the deepest habits design training has left me with is imagining the result before I begin.

When I draw, for example, I first imagine what the final picture should look like: how the form will be established, where the light will come from, how the light and shadow will fall, and what kind of atmosphere the image should eventually have. Of course I revise as I go, but the overall movement is still from the endpoint backwards. I start with a picture that does not yet exist on paper, then layer on detail until what is on the paper gradually approaches the image in my head.

Architecture has something similar going on. We often understand a “good building” through elements such as economy, beauty, and usefulness. Economy is relatively easy to quantify and relatively easy to inspect. Beauty and usefulness are not so simple. They are subjective, and much of the feedback arrives late. A building may already be finished before its users discover that it is inconvenient; it may already be standing before everyone realizes that it is not very beautiful. We cannot exactly demolish it and start again just because the final feedback was disappointing.

Computational design has made this somewhat more manageable. People can use parameters, models, and other computable methods to describe and quantify part of a design. It is like cutting off one piece of the mountain and placing it inside a coordinate system, where we can measure, compare, and adjust it. But it only handles one part of the mountain called design. It does not suddenly turn “what makes a design good” into a complete formula.

I still believe that making a good design requires experience, a sense of history, and a sufficiently broad range of knowledge and practice. Many design judgments are not derived from a particular rule. They grow slowly inside us after we have seen things, made things, been rejected, and made them again.

That is why I have always felt a little guilty about the idea of being commissioned to teach someone design. It is not that I do not want to help. It is that I would find it hard to honestly promise: I can completely hand over to you the method for making good design. Agreeing to that would carry a faint suspicion of misleading someone in the name of education.

I am not going to discuss how to teach design here. What matters about this example is that it made me realize something: some problems are complex not because we have not found a clever enough SOP, but because their goals contain elements that are delayed, subjective, and impossible to verify in advance.

## Software is not a picture that already exists in your head

Software engineering is not quite like drawing.

Of course, we can plan before development, draw architecture diagrams, write requirements, and spend a long time imagining the final shape of a system. The problem is that software’s final form may not exist at the beginning. We may not know what problems will appear during development, and we may not know whether the robust system we carefully built is actually what users need.

These two unknowns make “understand everything first, then start implementing” extremely expensive.

In drawing, if I decide on the final image at the beginning, I can move forward along the form and the light, step by step. In software, I might spend several weeks thinking through every boundary of a system, only to discover at the end that nobody needs it.

This is why small, fast steps have become increasingly useful. They do not mean “start before you have thought it through,” and they are not an excuse to give up engineering quality. They are more like a clever transfer of complexity: we move the complexity of “sitting in front of a blank sheet of paper and trying to enumerate every possible situation” into the complexity of “facing a concrete problem and thinking about how to solve it.”

The latter is usually easier to handle. A concrete problem has at least given us something: a failed result, real feedback, a place where a user actually got stuck, or a constraint that has already surfaced. We no longer have to use our imagination to play the user, the engineer, the designer, the tester, and our future selves all at once.

My friend said in the meeting that many things in the world are actually simple problems. Simple here does not mean they can be finished immediately. It means that once you truly understand the nature of a problem, you can analyse it and find a path that is relatively definite and relatively explainable.

A simple problem can still be painful. It can still take a long time. But at least it lets you know what to do next. Among all the roads that lead to Rome, you can find the one with the lowest cost for now, the fastest feedback, and the best chance of reaching the destination.

The difficulty of a complex problem is often that you do not even know which road leads to Rome.

## Move the mountain elsewhere

The meeting also touched on the DeepSeek harness, which has been getting a lot of attention lately.

In simple technical terms, a harness can be understood as a runtime framework wrapped around a model. It handles things such as how network requests are sent, how model messages are received, how context is organized, how tools are executed, whether a sandbox is used, and how different plugins or providers pass information to the model.

In the past, it was easy to mix these things together and refer to them broadly as “an Agent harness.” That is not entirely wrong, but it makes a system made of many parts look like one enormous, complete black box.

What interests me about the DeepSeek harness is not whether it offers one final, correct answer. It is that it makes part of the complexity visible as something easier to discuss: what a plugin is responsible for, where context comes from, how modules are combined, and whether a particular input actually makes the task better.

This does not make complexity disappear. It moves complexity from “how do I understand an entire Agent engineering system?” to “how do I organize context, manage relationships between modules, and judge the quality of an input?”

The mountain is still there. It has simply changed from one incomprehensible mountain into several rocks that can be moved and inspected separately.

This sentence stayed with me because it applies to more than harnesses. It also explains many of the things I did after taking over Flow canvas.

## How I turned team division into an Agent subscription rental business

When I first took over Flow canvas, I had a rather simple but rather heavy idea of what good team division meant: I needed to understand which features we would build at every stage.

So I started talking with my coding agent. How should a feature be built? Which issues should it be split into? What dependencies did they have? Which could run in parallel, and which had to be sequential? As we kept talking, the number of issues grew and the dependency graph became more and more beautiful. I gradually developed a familiar illusion: if this map was complete enough, the team could start working smoothly.

Looking back, I was building a highway for the division of labour. The highway was not even open yet, but I had already started discussing who should be responsible for each toll booth.

In the end, I distributed the issues to the team, and each person continued the conversation with their own Agent. It looked like division of labour. In reality, it was closer to this: I rented everyone’s Agent subscriptions and assembled the results of those rentals.

This does not mean that nobody was working, or that Agents were not useful. The real problem was that each person might receive a local explanation rather than a judgment formed in common. Everyone could make their own task complete, but those complete local pieces did not necessarily belong to the same thing.

I used to understand “talking it through with the Agent” as figuring out the implementation, issues, and dependencies of a feature in advance. Now I am beginning to think that what the team needs to clarify first may be much less than that.

Everyone should first know what experience this feature line is ultimately meant to bring to the user. Where does the user begin? What do they see? What can they complete? Why is this result worth building? The implementation can come later. It can even be explored by each person’s own Agent.

This does not mean turning product development into an acceptance checklist. I am simply beginning to see that the trust a team gives one another should not rest on “I believe you understand the issue.” It should rest on “we all know what this line of work is supposed to make the user feel.”

The unit of a problem is not necessarily an issue, nor is it necessarily a code module. Quite often, it should be a piece of user experience that everyone can understand together.

## AI makes individuals broader, but it should not make teams more scattered

AI Agents have changed something very practical: one person can now cover more kinds of work than before.

In the past, a feature might have required product, design, and engineering to participate separately. Now, with the help of an Agent, one person may be able to handle requirements, interaction, pages, and code at the same time. This change is impressive, and it can easily lead to another misunderstanding: if everyone can do more, perhaps all a team needs to do is divide the tasks evenly.

I do not think so.

AI has widened the boundaries of what an individual can do, but a team still needs clear contribution domains. Someone may be better at Agent development, someone else at UI design, and someone else at turning messy requirements into an executable path. Contribution domains are not isolated departments in the traditional sense. They are more like a support network.

Everyone can independently own a feature line. But when someone else runs into a problem involving Agents, interaction, visual design, or engineering, the person with strength in that area should step forward. A person’s ability is not only measured by what they can finish themselves. It is also measured by whether they can help other people take fewer wrong turns.

This may be what an AI-native team means to me now: not four people with their own Agents sitting together, but a group of people who can use AI to cover a wider range while still being willing to share their judgment and experience with one another.

AI makes each person more like a small team. It should not turn the real team into several unrelated small companies.

## If you do not roast me, I will roast you

In today’s meeting, I also said something I would probably not normally say so directly:

> If you spot a problem during development and do not come roast me, I will roast you instead.

It may be the least gentle sentence I have said in the first half of this year. After saying it, I was a little surprised myself: when did I start advocating that people argue in meetings? Had I not always wanted the team atmosphere to be friendly, communication smooth, and pressure low?

But I later felt that these two things were not contradictory.

I do not want people to attack one another, and I do not want arguments to become a performance of team culture. I mean that problems should surface early, and disagreements should appear early. Nobody needs to hide their disagreement in order to preserve surface-level harmony, only to leave one person carrying all the explanation, alignment, and rework at the end.

If nobody on a team ever objects, it may not be because everyone has genuinely reached consensus. It may be because nobody has found a safe enough way to express disagreement.

So I now even think that a team dreaming of making something cool may need to argue at the right moments, and perhaps argue with excessive force. Not to prove who is smarter, and not to defeat anyone, but to make a vague judgment reveal its problems as soon as possible.

Of course, arguing about a proposal is not the same as attacking a person. After the argument, there should also be something clearer than before: what exactly we were arguing about, which parts we have agreed on, and which parts can only be tested through practice.

My friend had often been forced to be the person who pointed out problems, and over time became the “bad guy” on the team. But if every problem has to wait for him to discover it, criticize it, and realign everyone around it, then the team’s surface gentleness is really just transferring the complexity and the burden to one person.

I hope that in the future, everyone can start the argument themselves, and let the friend occasionally be responsible for breaking it up. This division of labour may sound a little healthier than the traditional division between product, design, and engineering.

## A not-so-magical copper bullet

Large language models are not a silver bullet. This judgment also came up repeatedly today.

The silver bullet is attractive because it promises to solve a problem in one shot. It does not ask you to understand the ecology, body structure, or moon phases of a werewolf. Just take it out, fire once, and the matter is over. It is perfectly suited to the internet age, because we are always hoping that the next model, the next framework, or the next skill will shoot through complexity on our behalf.

But complexity is usually less cooperative than that.

I would rather call AI a copper bullet. It is not as magical, it does not guarantee a hit, and it will not decide where you should aim. But it is cheap enough, widespread enough, and capable enough to improve a person’s chances of getting something done.

It can let one person cover more product, design, and engineering work. It can help us make a rough baseline faster. It can hand part of the work of organizing context, retrieving information, and repeating routine tasks to a machine. But it will not automatically determine what users need, create consensus for a team, or tell us when a system has become too complex to keep adding to.

A copper bullet is not a failed version of a silver bullet. It is more like a tool that makes no promise of a miracle: you still need to aim, you still need to know where the target is, and you still have to bear the consequences of missing.

## The mountain has not disappeared

After listening to the meeting, I immediately asked my coding agent to delete every issue in the current codebase.

I do not think I changed some old habit after this meeting. Many old ways of working are simply what we naturally reach for when we do not yet have enough practical experience. Back then, I did not have enough experience to judge how high a mountain really was, or where I should move it.

What I truly learned this time was a way of thinking about a problem.

When faced with something that looks complex, I do not have to immediately search for a flawless system. I do not have to rush to enumerate every feature, every division of labour, and every possible future scenario. I can ask first: where is the real complexity of this problem? Does it come from unknowns, delayed feedback, coupling between different parts, or a kind of judgment that cannot be fully quantified?

Then I can consider whether to move it somewhere easier to observe, easier to verify, and easier to collaborate around.

Sometimes this means making a very rough version first. Sometimes it means breaking a huge system into modules. Sometimes it means letting the team first form a shared understanding of what the user will receive. Sometimes it means admitting that I cannot directly teach someone what good design is, and can only help them become a good user first: observing, feeling, and accumulating experience.

The mountain is still there.

We have simply stopped treating “getting over the mountain” as the only brave thing to do. Next time, perhaps I will first ask who built the mountain, why I am supposed to climb it, whether I can go around it, and — if I really decide to move it — whether I have thought through where it should go.
