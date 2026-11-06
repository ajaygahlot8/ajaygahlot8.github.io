---
title: "Claude as the brain of my AI agent"
description: "How I run Hermes Agent on Claude: which model does what, how work fans out to subagents, what caching and fallbacks do, and what broke along the way."
pubDate: 2026-11-07
tags: ["hermes", "claude", "ai-agents", "llm-routing", "engineering-management"]
draft: false
---

I run a personal agent, Hermes Agent, all day. It answers me on WhatsApp, watches my homelab, runs about thirty scheduled jobs and does coding chores on request. Its brain is Claude. This post is how that is wired, why I chose it, and what I would tell someone building the same thing.

## Why Claude for a long tool loop

An agent is not a chatbot. A typical task is thirty to a hundred tool calls: read a file, run a command, parse the output, decide, retry. Three properties matter more than benchmark headlines.

- **Instruction following over many turns.** The system prompt carries rules about trust tiers, which channel gets which message, and what never to touch. A model that drifts from them by turn forty is a liability, not a feature.
- **Tool use that stays well-formed.** Malformed arguments, invented tool names, or repeating a failed call forever are the usual ways loops die. Claude has been the most boring model here, which is the compliment I mean.
- **Long context that stays usable.** Sessions accumulate logs and diffs. I want the model to still find the one relevant line at the end.

I do not claim Claude wins everywhere. Other models are better at some things I use them for, and the routing below exists because of that.

## The routing

Everything is a few blocks in one config file. The main model is Anthropic over the native Messages API:

```yaml
model:
  default: claude-sonnet-5-5
  provider: anthropic
  api_mode: anthropic_messages
```

That default is the cheap baseline. When I want the strongest model for an interactive session I switch to Opus for that session, and the config does not change. A switch is not persisted unless I ask (`persist_switch_by_default: false`), so a one-off experiment cannot silently become my default bill.

Delegated work is where the routing earns its keep. Hermes can spawn subagents that run in parallel, each with its own context. I defined three named backends:

```yaml
delegation:
  max_iterations: 250
  backends:
    model_map:
      default: sonnet
      options:
        - name: sonnet   # coding, browser, multi-step tasks
          provider: anthropic
          model: claude-sonnet-5-5
        - name: glm      # lookups, summaries, simple edits
          provider: zai
          model: glm-5.3
        - name: grok     # a second opinion, research
          provider: xai-oauth
          model: grok-4.6
```

The rule of thumb: Opus for the conversation and for tasks where a wrong answer is expensive, Sonnet for most parallel subagents, a cheap model for anything that is a lookup or a summary, and Grok when I want a different model's opinion rather than more of the same.

Auxiliary jobs, which are not the main conversation, have their own lines. Context compression runs on Sonnet. A group of small background tasks run on the cheap GLM tier. Vision runs on xAI's Grok, and voice transcription also goes to xAI, because those were the better and cheaper fits for me. The brain is Claude; the eyes and ears are not.

## Counting what actually runs

I queried my local session store, read-only. About 3,000 sessions are recorded since July. Roughly a third have no model recorded, so treat these as counts of the ones that do:

| Model | Sessions |
|---|---|
| Claude Sonnet | ~530 |
| Claude Opus | ~500 |
| GLM (full and flash) | ~335 |
| Claude Haiku | ~250 |
| Grok | ~245 |

Claude is about 60% of the attributed sessions. Roughly a tenth of all sessions are children of another session, which is the subagent fan-out showing up in the data. These are session counts, not tokens or money. A session with a hundred tool calls and a one-line lookup both count as one, so this says where work is routed, not where cost lands.

## The provider layer

Hermes treats providers as interchangeable adapters. Anthropic's Messages API is one, xAI is another, and there is a generic OpenAI-compatible slot for anything else. That is what makes the routing above a config change rather than a code change.

## Cost and caching

Cost is the constraint that shapes the routing, so I watch two levers.

**Prompt caching.** An agent resends a long, mostly unchanged prefix every turn: system prompt, tool schemas, early history. Caching that prefix turns most of the input into cheap reads. Hermes injects the cache markers itself, and I set the lifetime to `auto`:

```yaml
prompt_caching:
  cache_ttl: auto
```

The trade-off from the code comments: the default five-minute lifetime costs 1.25x to write, the one-hour one costs 2x, and the longer one pays off only if you pause for more than five minutes between turns. My chats are bursty, with long gaps, so `auto` is better than guessing.

**Compression.** When a session reaches a threshold of its window, older turns are summarized by a cheaper model while the first few and last twenty messages stay verbatim:

```yaml
compression:
  enabled: true
  threshold: 0.3
  target_ratio: 0.2
  protect_first_n: 3
  protect_last_n: 20
```

A threshold of 0.3 is aggressive. I chose it because quality in long sessions fell off before the window ran out, and because a smaller context is faster and cheaper per turn. The cost is that detail from the middle gets lost, which I come back to below.

## Failure modes and fallbacks

Fallbacks are a short ordered list, all Anthropic for now:

```yaml
fallback_providers:
  - provider: anthropic
    model: claude-opus-5-5
  - provider: anthropic
    model: claude-sonnet-5-5
```

I will be honest about the weakness: that list protects me from a model being overloaded, not from the provider being down. All my fallbacks share one provider, so a provider outage takes everything with it. I have a local model alias for the offline case, but I switch to it by hand.

Other failures I have actually hit:

- **Runaway loops.** An agent that fails the same call repeatedly will happily burn money. I set hard stops: five identical failures, eight failures of the same tool, five calls with no progress. These saved me more than any prompt tweak.
- **Context compression forgetting.** A summary dropped a constraint I had given early in a long session. Protecting the first messages helped. Writing durable decisions to the memory layer, not leaving them in chat, helped more.
- **Subagents over-trusted.** A cheap subagent returned a confident wrong answer and the parent repeated it. Subagent output is a claim, not a fact. The parent should verify anything it acts on.
- **Config versus reality.** I have more than once assumed a session was on one model when it was on another. Because a model switch is not persisted, the file shows the baseline, not what is running. I now check the live session, not the file.

One CLI quirk to save you an afternoon: `--model X` on its own does not change the provider. If the name belongs to a different provider than the current one, you need `--provider` as well, otherwise the request goes to the old provider with a model name it does not know.

Coding is a special case. For big repository work, Hermes delegates to the Claude Code CLI in print mode, as a one-shot task with a turn limit and an allow-list of tools, and then reads the result. Using a purpose-built coding agent as a tool inside a general agent is cleaner than asking the general agent to be good at everything.

## What I learnt

- **Route by cost of being wrong, not by task type.** Lookups and summaries go to cheap models. Anything that edits state or makes a decision goes to the strongest model.
- **Make the baseline cheap and the upgrade explicit.** A default you can afford to leave running, and a non-persistent switch, stops expensive experiments becoming habits.
- **Cache first, then compress.** Caching is nearly free speed and money. Compression is lossy; treat it as a trade, and keep durable facts outside the chat.
- **A fallback list is only as independent as its members.** Mine is not independent, and I know it.
- **Hard stops beat clever prompts.** Limits on repeated failures are the cheapest reliability work I did.
- **Count the real thing.** Session counts told me about routing, not cost. Token-level accounting is the next thing to build.

As an engineering manager the pattern is familiar: a strong senior for the decisions, a team of juniors for the parallel legwork, and a rule that nobody's output goes out unchecked.
