import fs from 'fs'
import path from 'path'
import { app } from 'electron'

interface PlungeConfig {
  geminiApiKey?: string
}

let config: PlungeConfig = {}

export function loadConfig(): void {
  const configPath = path.join(app.getPath('home'), '.config', 'plunge', 'config.json')
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8')
      config = JSON.parse(raw)
    } catch {
      console.warn('[Config] Failed to parse config.json')
    }
  }
}

export function getGeminiApiKey(): string | null {
  return config.geminiApiKey?.trim() || null
}

export function isAiConfigured(): boolean {
  return getGeminiApiKey() !== null
}
