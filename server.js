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

// AI Provider config
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const API_KEY = process.env.API_KEY || '';
const BASE_URL = process.env.BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.MODEL || 'gpt-4o-mini';

// Store active sessions
const sessions = new Map();

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mello Code API' });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, projectName, language, sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'Missing prompt' });
    }

    // Store session
    if (sessionId) {
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
    }

    const systemPrompt = `You are Mello Code, an AI coding assistant specialized in:
- General programming and software engineering
- Roblox game development and Luau scripting
- Project planning and architecture
- Debugging and code review
- Creating complete, connected systems

Be practical, direct, and precise. Provide working code when asked.
If asked about Roblox, focus on Luau scripting, game mechanics, and Studio integration.
When generating code, explain the changes and why they matter.`;

    const response = await callAIProvider(prompt, systemPrompt, language);

    res.json({
      ok: true,
      response: response,
      sessionId: sessionId || generateSessionId()
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      ok: false,
      error: error.message || 'AI request failed'
    });
  }
});

// Roblox Studio plugin bridge
app.post('/api/roblox/bridge', async (req, res) => {
  try {
    const { source, projectName, prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'Missing prompt' });
    }

    const systemPrompt = `You are Mello Code, assisting with Roblox game development.
Project: ${projectName || 'Unknown'}
Context: ${JSON.stringify(context || {})}

Generate Luau code for Roblox Studio.
Include proper script placement (ServerScriptService, ReplicatedStorage, StarterGui, etc.)
Be specific about where each script should go.`;

    const response = await callAIProvider(prompt, systemPrompt, 'lua');

    res.json({
      ok: true,
      reply: response,
      source: 'mello-code-api',
      platform: 'Roblox Studio'
    });
  } catch (error) {
    console.error('Roblox bridge error:', error.message);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Website dashboard API
app.post('/api/generate-code', async (req, res) => {
  try {
    const { prompt, language, framework } = req.body;

    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'Missing prompt' });
    }

    const fullPrompt = `Generate ${language || 'JavaScript'} code for: ${prompt}\nFramework: ${framework || 'none'}`;
    const response = await callAIProvider(fullPrompt, 'You are an expert code generator.', language);

    res.json({
      ok: true,
      code: response
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// AI Provider abstraction
async function callAIProvider(prompt, systemPrompt, language) {
  try {
    if (AI_PROVIDER === 'openai' || AI_PROVIDER === 'openai-compatible') {
      const endpoint = `${BASE_URL}/chat/completions`;
      const response = await axios.post(endpoint, {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    }

    if (AI_PROVIDER === 'local-ollama') {
      const endpoint = 'http://localhost:11434/api/generate';
      const response = await axios.post(endpoint, {
        model: MODEL || 'qwen2.5-coder:7b',
        prompt: prompt,
        system: systemPrompt,
        stream: false
      });

      return response.data.response;
    }

    throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
  } catch (error) {
    throw new Error(`AI provider error: ${error.message}`);
  }
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ ok: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n✨ Mello Code API running on http://localhost:${PORT}`);
  console.log(`📡 AI Provider: ${AI_PROVIDER}`);
  console.log(`🤖 Model: ${MODEL}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}\n`);
});

module.exports = app;
