// Supabase Edge Function AI Service
const SUPABASE_URL = 'https://giyheniqqqwpmetefdxj.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;

/**
 * Send a chat message to the AI via Supabase Edge Function
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional parameters (model, temperature, maxTokens, stream)
 * @returns {Promise<Object>} - AI response
 */
export async function chatWithAI(messages, options = {}) {
  const {
    model = 'deepseek-chat',
    temperature = 0.7,
    maxTokens = 4000,
    stream = false,
  } = options;

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'AI request failed');
    }

    return {
      message: data.message,
      usage: data.usage,
      model: data.model,
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
}

/**
 * Generate a chat completion with a simple prompt
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<string>} - AI response text
 */
export async function generateCompletion(prompt, systemPrompt = null) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: prompt,
  });

  const response = await chatWithAI(messages);
  return response.message.content;
}

/**
 * Get AI assistance for steel grade information
 * @param {string} grade - Steel grade (e.g., "A36", "1018")
 * @returns {Promise<string>} - Grade information
 */
export async function getGradeInfo(grade) {
  const systemPrompt = `You are a steel industry expert. Provide concise, accurate information about steel grades.`;
  const prompt = `What is ${grade} steel? Include key properties, common uses, and typical specifications.`;

  return await generateCompletion(prompt, systemPrompt);
}

/**
 * Get AI assistance for production planning
 * @param {Object} jobDetails - Job details
 * @returns {Promise<string>} - Planning suggestions
 */
export async function getPlanningAssistance(jobDetails) {
  const systemPrompt = `You are a manufacturing planning expert. Provide practical production advice.`;
  const prompt = `Given this job: ${JSON.stringify(jobDetails)}, suggest optimal sequencing and considerations.`;

  return await generateCompletion(prompt, systemPrompt);
}

/**
 * Get AI quality control analysis
 * @param {Object} testResults - Test result data
 * @returns {Promise<string>} - QC analysis
 */
export async function analyzeQualityResults(testResults) {
  const systemPrompt = `You are a metallurgy and quality control expert. Analyze test results and provide insights.`;
  const prompt = `Analyze these test results and identify any concerns: ${JSON.stringify(testResults)}`;

  return await generateCompletion(prompt, systemPrompt);
}

export default {
  chatWithAI,
  generateCompletion,
  getGradeInfo,
  getPlanningAssistance,
  analyzeQualityResults,
};
