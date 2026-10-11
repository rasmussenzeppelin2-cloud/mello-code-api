# Mello Code

Mello Code is a local-first AI coding assistant for websites, apps, Roblox game development, and backend systems.

## Features

- 3 AI modes: fast, balanced, quality
- OpenAI, Anthropic, Gemini, and Ollama support
- Web dashboard built for a Codex/Claude-like workspace
- Roblox Studio bridge support
- Local-first and fully extensible

## Quick start

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env`
3. Fill in your API keys or run a local Ollama model
4. Start the app:
   npm run dev
5. Open http://localhost:3001

## AI mode configuration

- Fast: best for quick assistance, can use local Ollama
- Balanced: good default for most tasks
- Quality: strongest reasoning for complex code

## Local Ollama example

```bash
ollama pull qwen2.5-coder:7b
```

Then set:

```env
AI_FAST_PROVIDER=ollama
AI_FAST_MODEL=qwen2.5-coder:7b
AI_FAST_BASE_URL=http://localhost:11434
```

## OpenAI example

```env
AI_BALANCED_PROVIDER=openai
AI_BALANCED_MODEL=gpt-4o-mini
AI_BALANCED_KEY=your-key
AI_QUALITY_PROVIDER=openai
AI_QUALITY_MODEL=gpt-4o
AI_QUALITY_KEY=your-key
```

## Windows installer

The repository includes installation helpers for Windows in the `installers` folder.

## License

MIT

