import { Router, Request, Response } from 'express';
import { promptCache } from '../cache/promptCache';
import { concurrencyLimit } from '../middleware/concurrency';
import axios from 'axios';

const router = Router();

// Hard‑coded starter prompts for this phase
const starterPrompts = [
  'Explain the portfolio summary.',
  'List the top three projects.',
  'Describe the design philosophy.',
  'Give a brief intro about the author.',
];

// Helper to build system prompt (simplified)
function buildSystemPrompt(userPrompt: string): string {
  // For now just prepend a directive
  return `Answer using only data from the portfolio DB. User asks: ${userPrompt}`;
}

// Mock LLM call – replace with real call when LLM_URL is set
async function callLLM(systemPrompt: string): Promise<{ message: string; tool?: any }> {
  const llmUrl = process.env.LLM_URL;
  if (llmUrl) {
    const response = await axios.post(llmUrl, { prompt: systemPrompt });
    return response.data;
  }
  // Mock deterministic response with artificial delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 200));
  if (systemPrompt.toLowerCase().includes('top three projects')) {
    return {
      message: `Mock response for: ${systemPrompt}`,
      tool: {
        type: 'projectList',
        projects: [
          { name: 'Project A', description: 'Desc A' },
          { name: 'Project B', description: 'Desc B' }
        ]
      }
    };
  }
  return { message: `Mock response for: ${systemPrompt}` };
}

router.post('/', concurrencyLimit, async (req: Request, res: Response) => {
  console.log('Handler received position:', (req as any).position);
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  // Check cache for starter prompts
  if (starterPrompts.includes(prompt)) {
    const cached = promptCache.get(prompt);
    if (cached) {
      const position = (req as any).position;
      const result = { ...cached };
      if (position !== null && position !== undefined) {
        result.position = position;
      }
      return res.json(result);
    }
  }

  const systemPrompt = buildSystemPrompt(prompt);
  let llmResponse = await callLLM(systemPrompt);

  // Parse tool call if message contains JSON
  if (typeof llmResponse.message === 'string') {
    const trimmed = llmResponse.message.trim();
    if (trimmed.startsWith('{')) {
      try {
        llmResponse.tool = JSON.parse(trimmed);
      } catch (e) {
        // If parsing fails, leave tool undefined
      }
    }
  }

  // Cache response if it's a starter prompt
  if (starterPrompts.includes(prompt)) {
    promptCache.set(prompt, llmResponse);
  }

  // Attach position if queued
  const position = (req as any).position;
  if (position !== null && position !== undefined) {
    (llmResponse as any).position = position;
  }

  res.json(llmResponse);
});



export default router;
