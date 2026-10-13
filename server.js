require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve the dashboard website
app.use(express.static('public'));

const MODEL_PRESETS = {
  fast: {
    provider: process.env.AI_FAST_PROVIDER || 'ollama',
    model: process.env.AI_FAST_MODEL || 'qwen2.5-coder:7b',
    apiKey: process.env.AI_FAST_KEY || process.env.API_KEY || '',
    baseUrl: process.env.AI_FAST_BASE_URL || process.env.BASE_URL || 'http://localhost:11434'
  },
  balanced: {
    provider: process.env.AI_BALANCED_PROVIDER || 'openai',
    model: process.env.AI_BALANCED_MODEL || process.env.MODEL || 'gpt-4o-mini',
    apiKey: process.env.AI_BALANCED_KEY || process.env.API_KEY || '',
    baseUrl: process.env.AI_BALANCED_BASE_URL || process.env.BASE_URL || 'https://api.openai.com/v1'
  },
  quality: {
    provider: process.env.AI_QUALITY_PROVIDER || 'openai',
    model: process.env.AI_QUALITY_MODEL || 'gpt-4o',
    apiKey: process.env.AI_QUALITY_KEY || process.env.API_KEY || '',
    baseUrl: process.env.AI_QUALITY_BASE_URL || process.env.BASE_URL || 'https://api.openai.com/v1'
  }
};

const sessions = new Map();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Mello Code API',
    models: Object.keys(MODEL_PRESETS),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/models', (req, res) => {
  res.json({
    ok: true,
    models: Object.entries(MODEL_PRESETS).map(([key, value]) => ({
      id: key,
      provider: value.provider,
      model: value.model,
      baseUrl: value.baseUrl
    }))
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, projectName, language, sessionId, mode = 'balanced' } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'Missing prompt' });
    }

    const runtimeMode = MODEL_PRESETS[mode] ? mode : 'balanced';
    const systemPrompt = buildSystemPrompt(projectName, language);

    const response = await callProvider(runtimeMode, prompt, systemPrompt, language);

    return res.json({
      ok: true,
      response,
      mode: runtimeMode,
      sessionId: sessionId || generateSessionId()
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ ok: false, error: error.message || 'AI request failed' });
  }
});

app.post('/api/generate-code', async (req, res) => {
  try {
    const { prompt, language, framework, mode = 'balanced' } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'Missing prompt' });
    }

    const fullPrompt = `Generate ${language || 'JavaScript'} code for: ${prompt}\nFramework: ${framework || 'none'}\nReturn clean, working code and short explanation.`;
    const response = await callProvider(mode, fullPrompt, 'You are an expert software engineer and code generator.', language);

    return res.json({ ok: true, code: response, mode });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/roblox/bridge', async (req, res) => {
  try {
    const { source, projectName, prompt, context, mode = 'fast' } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'Missing prompt' });
    }

    const systemPrompt = `You are Mello Code, assisting with Roblox game development. Project: ${projectName || 'Unknown'}\nContext: ${JSON.stringify(context || {})}\nGenerate Luau code for Roblox Studio. Include service placement and explain where each script goes.`;
    const response = await callProvider(mode, prompt, systemPrompt, 'lua');

    return res.json({ ok: true, reply: response, source: source || 'mello-code-api', platform: 'Roblox Studio', mode });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

async function callProvider(mode, userPrompt, systemPrompt, language = 'javascript') {
  const preset = MODEL_PRESETS[mode] || MODEL_PRESETS.balanced;

  switch (preset.provider) {
    case 'openai':
      return callOpenAI(preset, userPrompt, systemPrompt);
    case 'anthropic':
      return callAnthropic(preset, userPrompt, systemPrompt);
    case 'gemini':
      return callGemini(preset, userPrompt, systemPrompt);
    case 'ollama':
      return callOllama(preset, userPrompt, systemPrompt);
    default:
      throw new Error(`Unsupported provider: ${preset.provider}`);
  }
}

async function callOpenAI(preset, userPrompt, systemPrompt) {
  if (!preset.apiKey) {
    throw new Error('OpenAI key missing. Set AI_BALANCED_KEY or AI_QUALITY_KEY.');
  }

  const response = await axios.post(`${preset.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    model: preset.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2048
  }, {
    headers: {
      Authorization: `Bearer ${preset.apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data?.choices?.[0]?.message?.content || 'No response from OpenAI.';
}

async function callAnthropic(preset, userPrompt, systemPrompt) {
  if (!preset.apiKey) {
    throw new Error('Anthropic key missing. Set AI_FAST_KEY for Anthropic mode.');
  }

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: preset.model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  }, {
    headers: {
      'x-api-key': preset.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  });

  return response.data?.content?.[0]?.text || 'No response from Anthropic.';
}

async function callGemini(preset, userPrompt, systemPrompt) {
  if (!preset.apiKey) {
    throw new Error('Gemini key missing. Set AI_QUALITY_KEY or AI_FAST_KEY for Gemini.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${preset.model}:generateContent?key=${preset.apiKey}`;
  const response = await axios.post(url, {
    contents: [{
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  });

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
}

async function callOllama(preset, userPrompt, systemPrompt) {
  const url = `${preset.baseUrl.replace(/\/$/, '')}/api/generate`;
  const response = await axios.post(url, {
    model: preset.model,
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    stream: false,
    format: 'text'
  });

  return response.data?.response || 'No response from Ollama.';
}

function buildSystemPrompt(projectName, language) {
  return `You are Mello Code, an expert AI coding assistant.
Focus on: software engineering, debugging, architecture, Roblox Luau, web apps, automation, and clean production code.
Project: ${projectName || 'Unspecified'}
Language target: ${language || 'JavaScript'}
Be direct, practical, and produce working code when possible.
Return clear code blocks and brief reasoning.`;
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log('\n✨ Mello Code API running on http://localhost:' + PORT);
  console.log('Available modes:');
  Object.entries(MODEL_PRESETS).forEach(([key, preset]) => {
    console.log(`- ${key}: ${preset.provider}/${preset.model}`);
  });
  console.log('\nSet your keys in .env or run local Ollama for free models.\n');
});

module.exports = app;
