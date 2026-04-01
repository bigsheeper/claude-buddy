# claude-buddy

[English](README.md) | [中文](README_zh.md)

A tamagotchi-like coding companion that lives in your terminal. Inspired by [Claude Code](https://claude.ai/claude-code)'s built-in pet system.

![screenshot](screenshot.png)

## What is this?

Claude Code (Anthropic's official CLI) ships with a hidden electronic pet — a small ASCII companion that sits beside your input box, reacts to your coding, and has its own personality and stats.

**claude-buddy** extracts and reimplements that entire pet system as a standalone terminal app. It runs in a tmux pane alongside your normal workflow, so you always have a coding companion watching over you.

## Features

### 18 Species

Your companion is **deterministically generated** from your username — everyone gets a unique pet.

```
  Duck        Goose       Blob        Cat         Dragon      Octopus
  <(· )___    (·>         (··)        =·ω·=       <·~·>       ~(··)~
   (  ._>      ||         .----.      /\_/\       /^\  /^\      .----.
    `--´      _(__)_     ( ·  · )    ( ·   ·)    <  ·  ·  >   ( ·  · )
              ^^^^        `----´     (  ω  )     (   ~~   )   (______)

  Owl         Penguin     Turtle      Snail       Ghost       Axolotl
  (·)(·)      (·>)        [·_·]       ·(@)        /··\        }·.·{
   /\  /\     .---.       _,--._     .--.         .----.     }~(______)~{
  ((·)(·))    (·>·)      ( ·  · )   ( @ )        / ·  · \   }~(· .. ·)~{
  (  ><  )   /(   )\     /[______]\   \_`--´      |      |    ( .--. )

  Capybara    Cactus      Robot       Rabbit      Mushroom    Chonk
  (·oo·)      |·  ·|      [··]       (·..·)       |·  ·|     (·.·)
  n______n    ____        .[||].     (\__/)      .-o-OO-o-.   /\    /\
 ( ·    · )  |·  ·|      [ ·  · ]   ( ·  · )   (__________)  ( ·    · )
 (   oo   )  |_|  |_|    [ ==== ]   =(  ..  )=    |·  ·|     (   ..   )
```

### 5 Rarity Tiers

| Rarity | Chance | Stars | Stat Floor | Hat? |
|--------|--------|-------|------------|------|
| Common | 60% | ★ | 5 | No |
| Uncommon | 25% | ★★ | 15 | Yes |
| Rare | 10% | ★★★ | 25 | Yes |
| Epic | 4% | ★★★★ | 35 | Yes |
| Legendary | 1% | ★★★★★ | 50 | Yes |

Plus a **1% chance of being Shiny** (displayed with sparkles).

### 8 Hat Styles

Non-common pets get a randomly assigned hat:

```
  \^^^/    [___]    -+-     (   )    /^\     (___)    ,>
  crown    tophat  propeller  halo   wizard  beanie  tinyduck
```

### 5 Stats

Each pet has a **peak stat** and a **dump stat**, with the rest scattered. Stats influence personality:

- **DEBUGGING** — How helpful their coding tips are
- **PATIENCE** — Frequency of encouraging messages
- **CHAOS** — Likelihood of chaotic quips
- **WISDOM** — Deep programming insights
- **SNARK** — Sarcastic commentary rate

### Growth System (20 Levels)

Your buddy gains XP and levels up over time:

| XP Source | Amount | Cap |
|-----------|--------|-----|
| Daily login | +10 XP | 1x/day |
| Pet (touch) | +2 XP | 20 XP/day |
| View stats | +1 XP | 5 XP/day |
| git commit | +5 XP | uncapped |
| Terminal commands | +1 XP | per 10 commands |
| Consecutive days | +5 × streak | resets on miss |

**Milestone unlocks:**

| Level | Reward |
|-------|--------|
| 5 | Teen form + sleeping animation |
| 10 | Adult form + 3 new hats + new quips |
| 15 | Elite form + dancing animation + 3 new hats |
| 20 | Legend form (glowing border) + all content |

Stats grow with level — all stats get +5/+10/+15/+20 at milestones, plus peak stat gets +2 per even level.

### Visual Evolution

Each form adds decorations to your buddy's sprite:

| Form | Level | Visual Effect |
|------|-------|---------------|
| Baby | 1-4 | Base sprite |
| Teen | 5-9 | Sparkle accent |
| Adult | 10-14 | Side glow markers `>...<` |
| Elite | 15-19 | Side decorations `»...«` + bottom accent |
| Legend | 20 | Golden color + `✦` border |

### Animations

- **Idle loop** — 15-frame sequence at 500ms ticks (~7.5s cycle): mostly resting, occasional fidgets, rare blinks
- **Petting** — 5-frame floating hearts animation (2.5s burst)
- **Speaking** — Speech bubble with word-wrap, 10s display, 3s fade-out
- **Sleeping** (level 5+) — zzZ floating above sprite, closed eyes, triggers after 60s idle
- **Dancing** (level 15+) — side-to-side bounce while being petted

### Speech Bubbles

Your buddy speaks periodically (30s-120s intervals) with personality-weighted quips:

```
  ┌──────────────────────────────────────┐
  │ "Premature optimization is the root  │
  │  of all evil."                       │
  ╰──────────────────────────────────────╯
```

High SNARK pets are sassier. High WISDOM pets share tips. High PATIENCE pets are more encouraging.

## Installation

### Prerequisites

- **Node.js** >= 18
- **tmux** (for pane mode)

```bash
# Install tmux if you don't have it
brew install tmux      # macOS
sudo apt install tmux  # Ubuntu/Debian
```

### Quick Start

```bash
# Clone and build
git clone https://github.com/bigsheeper/claude-buddy.git
cd claude-buddy
npm install
npm run build

# Install auto-start (adds to ~/.zshrc, one-time setup)
node dist/cli.js install
```

That's it. Open a new terminal and your buddy will be there.

Every new terminal window automatically enters tmux with a buddy pane on the right (20 cols). Each terminal gets its own independent session — fresh every time, no leftover history.

### Uninstall

```bash
node dist/cli.js uninstall   # Removes the snippet from ~/.zshrc
```

## Usage

### CLI Commands (from any terminal)

```bash
claude-buddy pet        # Pet your buddy (♥)
claude-buddy stats      # Toggle stats display
claude-buddy mute       # Toggle speech bubbles
claude-buddy stop       # Close the buddy pane
```

### In-Pane Keyboard Shortcuts

Click the buddy pane, then:

| Key | Action |
|-----|--------|
| `p` | Pet your buddy (triggers heart animation) |
| `s` | Toggle stats card |
| `m` | Mute/unmute speech bubbles |
| `h` | Show/hide help |
| `q` | Quit |

### tmux Tips

- **Switch pane focus**: `Ctrl+b` then arrow key
- **Scroll**: two-finger trackpad scroll (requires `set -g mouse on` in `~/.tmux.conf`)
- **Keyboard scroll**: `Ctrl+b [` to enter scroll mode, `q` to exit

## Architecture

```
claude-buddy/
├── src/
│   ├── cli.ts              # Entry point & tmux management
│   ├── main.tsx            # Ink app bootstrap
│   ├── companion/
│   │   ├── types.ts        # Species, Rarity, Stats definitions
│   │   ├── companion.ts    # Deterministic pet generation (Mulberry32 RNG)
│   │   └── sprites.ts      # ASCII art frames (18 species × 3 frames)
│   ├── ui/
│   │   ├── App.tsx          # Root Ink component
│   │   ├── CompanionSprite.tsx  # Sprite + animation engine
│   │   ├── SpeechBubble.tsx     # Word-wrapped bubble renderer
│   │   └── StatsCard.tsx        # Stats display card
│   ├── state/
│   │   ├── config.ts       # ~/.claude-buddy/config.json persistence
│   │   └── state.ts        # Runtime state management
│   ├── ipc/
│   │   ├── server.ts       # Unix socket server (in buddy pane)
│   │   └── client.ts       # Socket client (for external commands)
│   └── quips/
│       └── index.ts        # Personality-weighted random quip engine
```

### How It Works

1. **Pet generation is deterministic** — your username is hashed with Mulberry32 PRNG to generate "bones" (species, eyes, hat, rarity, stats). Same user always gets the same pet.
2. **Soul is persistent** — name and personality are stored in `~/.claude-buddy/config.json` after first hatch. Bones are regenerated on every read (prevents config editing to fake a rare pet).
3. **IPC via Unix socket** — the buddy pane listens on `~/.claude-buddy/buddy.sock`, so `claude-buddy pet` from any terminal reaches it.
4. **Ink (React for terminals)** renders the TUI with 500ms tick-based animation.

## Inspired By

This project is a faithful reimplementation of the companion system found in [Claude Code](https://claude.ai/claude-code) by Anthropic. The original system was built with TypeScript + Ink and integrated directly into the Claude Code CLI. claude-buddy extracts it as a standalone tool anyone can use.

Key differences from the original:
- **Standalone** — runs independently, not embedded in Claude Code
- **tmux-based** — lives in its own pane instead of inline with a REPL
- **No AI integration** — uses random quips instead of model-generated reactions (for now)
- **Open source** — MIT licensed

## License

MIT
