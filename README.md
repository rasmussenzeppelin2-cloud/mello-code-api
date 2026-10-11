# Mello Code AI configuration
# Choose 3 modes: fast, balanced, quality

# Fast model: local Ollama is best for free and fast coding
AI_FAST_PROVIDER=ollama
AI_FAST_MODEL=qwen2.5-coder:7b
AI_FAST_BASE_URL=http://localhost:11434
AI_FAST_KEY=

# Balanced model: OpenAI-compatible or other paid provider
AI_BALANCED_PROVIDER=openai
AI_BALANCED_MODEL=gpt-4o-mini
AI_BALANCED_BASE_URL=https://api.openai.com/v1
AI_BALANCED_KEY=

# Quality model: stronger model for complex work
AI_QUALITY_PROVIDER=openai
AI_QUALITY_MODEL=gpt-4o
AI_QUALITY_BASE_URL=https://api.openai.com/v1
AI_QUALITY_KEY=

# Optional global fallback values
API_KEY=
BASE_URL=https://api.openai.com/v1
MODEL=gpt-4o-mini
PORT=3001
