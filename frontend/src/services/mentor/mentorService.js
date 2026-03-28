const BASE_URL = import.meta.env.VITE_MENTOR_API_URL || 'http://localhost:8021';

export const mentorService = {
  async chatStream(messages, userContext, onToken) {
    const response = await fetch(`${BASE_URL}/api/mentor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        user_context: userContext,
      }),
    });

    if (!response.ok) throw new Error('MentorAI service unavailable');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return accumulated;
        accumulated += data;
        onToken(accumulated);
      }
    }

    return accumulated;
  },
};
