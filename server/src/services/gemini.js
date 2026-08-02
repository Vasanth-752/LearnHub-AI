import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export const geminiPro = genAI.getGenerativeModel({
  model: env.GEMINI_MODEL_PRO,
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
  },
})

export const geminiFlash = genAI.getGenerativeModel({
  model: env.GEMINI_MODEL_FLASH,
  generationConfig: {
    temperature: 0.5,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  },
})

// Structured output helper
export async function generateStructured(model, prompt, schema) {
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  })

  const response = result.response
  const text = response.text()

  try {
    return JSON.parse(text)
  } catch (error) {
    console.error('Failed to parse Gemini JSON response:', text)
    throw new Error('Invalid JSON response from AI')
  }
}