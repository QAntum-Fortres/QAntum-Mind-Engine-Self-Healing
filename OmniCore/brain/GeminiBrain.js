/**
 * @fileoverview Gemini Brain - AI integration for intelligent decision making
 * @module core/GeminiBrain
 * @version 8.5.0
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { CONFIG } = require('../../config/constants');

/**
 * GeminiBrain provides AI-powered analysis and decision making
 * @class
 */
class GeminiBrain {
    /**
     * Create a GeminiBrain instance
     * @param {KnowledgeBase} [knowledge] - Optional knowledge base for context
     */
    constructor(knowledge = null) {
        if (!CONFIG.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required. Set it in your .env file.');
        }

        /** @type {GoogleGenerativeAI} */
        this.genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
        /** @type {GenerativeModel} */
        this.model = this.genAI.getGenerativeModel({ model: CONFIG.MODEL_NAME });
        /** @type {ChatSession|null} */
        this.chat = null;
        /** @type {KnowledgeBase|null} */
        this.knowledge = knowledge;
        /** @type {number} */
        this.tokenCount = 0;
    }

    /**
     * Start a new chat session
     * @param {Object} [config] - Optional generation config
     * @returns {void}
     */
    startSession(config = {}) {
        this.chat = this.model.startChat({
            generationConfig: {
                maxOutputTokens: config.maxOutputTokens || 4096,
                temperature: config.temperature || 0.7
            }
        });
        this.tokenCount = 0;
    }

    /**
     * Send a message and get AI response
     * @param {string} prompt - Input prompt
     * @returns {Promise<string>} AI response
     */
    async think(prompt) {
        if (!this.chat) {
            this.startSession();
        }

        try {
            const result = await this.chat.sendMessage(prompt);
            const response = result.response.text();

            // Track approximate token usage
            this.tokenCount += Math.ceil((prompt.length + response.length) / 4);

            return response;
        } catch (e) {
            console.error(`   ❌ AI Error: ${e.message}`);

            // Handle rate limiting
            if (e.message.includes('429') || e.message.includes('quota')) {
                console.log('   ⏳ Rate limited, waiting 10 seconds...');
                await this.sleep(10000);
                return await this.think(prompt);
            }

            throw e;
        }
    }

    /**
     * Analyze an image with optional semantic context
     * @param {string} base64Image - Base64 encoded image
     * @param {string} prompt - Analysis prompt
     * @param {string} [semanticMap=''] - Optional semantic element map
     * @returns {Promise<string>} Analysis result
     */
    async analyzeImage(base64Image, prompt, semanticMap = '') {
        const enhancedPrompt = `${prompt}

${semanticMap ? '🎯 SEMANTIC MAP (interactive elements):\n' + semanticMap + '\n' : ''}

При анализа включи:
1. Какво виждаш на страницата
2. Налични бутони, форми, линкове
3. Грешки или проблеми ако има
4. Предложение за следващо действие с КОНКРЕТЕН селектор`;

        try {
            const result = await this.model.generateContent([
                enhancedPrompt,
                { inlineData: { data: base64Image, mimeType: "image/png" } }
            ]);

            const response = result.response.text();
            this.tokenCount += Math.ceil((enhancedPrompt.length + response.length) / 4);

            return response;
        } catch (e) {
            console.error(`   ❌ Image analysis error: ${e.message}`);
            throw e;
        }
    }

    /**
     * Get a quick classification without full analysis
     * @param {string} question - Question to classify
     * @param {Array<string>} options - Possible options
     * @returns {Promise<string>} Selected option
     */
    async classify(question, options) {
        const prompt = `Classify the following. Answer with ONLY one of the options, nothing else.

Question: ${question}

Options: ${options.join(', ')}

Answer:`;

        const response = await this.think(prompt);
        const answer = response.trim().toLowerCase();

        // Find best match
        const match = options.find(opt =>
            answer.includes(opt.toLowerCase()) ||
            opt.toLowerCase().includes(answer)
        );

        return match || options[0];
    }

    /**
     * Generate a test scenario based on page analysis
     * @param {string} pageDescription - Description of the page
     * @param {string} goal - Test goal
     * @returns {Promise<Array<string>>} Array of actions to perform
     */
    async generateTestPlan(pageDescription, goal) {
        const prompt = `Generate a step-by-step test plan.

Page: ${pageDescription}
Goal: ${goal}

Return ONLY a JSON array of actions, like:
["ACTION: CLICK | #login", "ACTION: TYPE | #email | test@example.com", "ACTION: DONE | Login tested"]`;

        const response = await this.think(prompt);

        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn(`   ⚠️ Failed to parse test plan: ${e.message}`);
        }

        return [];
    }

    /**
     * Analyze an error and suggest solutions
     * @param {string} errorMessage - Error message
     * @param {string} context - Context where error occurred
     * @returns {Promise<Object>} Analysis with suggestions
     */
    async analyzeError(errorMessage, context) {
        const prompt = `Analyze this error and suggest solutions.

Error: ${errorMessage}
Context: ${context}

Return JSON with:
{
  "cause": "Brief explanation of the cause",
  "solutions": ["Solution 1", "Solution 2"],
  "severity": "low|medium|high|critical"
}`;

        const response = await this.think(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn(`   ⚠️ Failed to parse error analysis: ${e.message}`);
        }

        return {
            cause: 'Unknown',
            solutions: ['Try again', 'Check the selector'],
            severity: 'medium'
        };
    }

    /**
     * Get estimated token usage
     * @returns {Object} Token usage stats
     */
    getTokenUsage() {
        return {
            estimated: this.tokenCount,
            costEstimate: `$${((this.tokenCount / 1000) * 0.001).toFixed(4)}`
        };
    }

    /**
     * Reset the chat session
     * @returns {void}
     */
    resetSession() {
        this.chat = null;
        this.tokenCount = 0;
    }

    /**
     * Sleep helper
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

module.exports = { GeminiBrain };
