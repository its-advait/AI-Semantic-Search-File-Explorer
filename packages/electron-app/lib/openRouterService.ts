/**
 * Service for interacting with the OpenRouter API.
 */
class OpenRouterService {
  /**
   * Generates text using a specified model from OpenRouter.
   * @param prompt The prompt to send to the model.
   * @param model The model to use for the generation. Defaults to 'google/gemini-flash-1.5'.
   * @returns The JSON response from the API.
   */
  async generateText(prompt: string, model = 'google/gemini-flash-1.5') {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("The NEXT_PUBLIC_OPENROUTER_API_KEY environment variable is not set.");
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

export const openRouterService = new OpenRouterService();
