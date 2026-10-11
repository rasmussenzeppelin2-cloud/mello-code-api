# Mello Code API

Free, open-source AI coding backend for Mello Code desktop app, website, and Roblox Studio plugin.

## Features

- Chat-based code generation
- Project-aware coding workflows
- Roblox Luau scripting support
- Multiple AI provider support (OpenAI-compatible, local models)
- Roblox Studio plugin bridge
- No mandatory credits or billing

## Quick Start

```bash
npm install
npm run dev
```

API runs on `http://localhost:3001`

## Endpoints

### `POST /api/chat`
Send a coding prompt and get a response.

```json
{
  "prompt": "Create a Roblox tycoon game",
  "projectName": "MyGame",
  "language": "luau"
}
```

### `POST /api/roblox/bridge`
Roblox Studio plugin connection.

```json
{
  "source": "roblox-plugin",
  "projectName": "My Roblox Game",
  "prompt": "Add a shop system"
}
```

## Deployment

Deploy to:
- Railway
- Vercel
- Heroku
- DigitalOcean
- Your own server

## License

MIT
