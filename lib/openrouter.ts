export interface OpenRouterMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callOpenRouter(messages: OpenRouterMessage[], model = "x-ai/grok-2-1212"): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set")
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://v0.app",
      "X-Title": "Eryndor RPG",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data.choices[0]?.message?.content || ""
}
