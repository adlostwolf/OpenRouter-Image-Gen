import fetch from 'node-fetch';

/**
 * Initialize plugin.
 * @param {import('express').Router} router Express router
 * @returns {Promise<any>} Promise that resolves when plugin is initialized
 */
async function init(router) {
    router.post('/generate', async (req, res) => {
        try {
            const { prompt, model, apiKey } = req.body;

            if (!prompt || !model || !apiKey) {
                return res.status(400).json({ error: 'Missing prompt, model, or apiKey' });
            }

            const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    // Add other params if needed, like size, etc.
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                return res.status(response.status).json({ error });
            }

            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error('Image generation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    console.log('OpenRouter Image Gen plugin loaded!');
    return Promise.resolve();
}

async function exit() {
    return Promise.resolve();
}

export default {
    init,
    exit,
    info: {
        id: 'openrouter-image-gen',
        name: 'OpenRouter Image Generation',
        description: 'Generate images using OpenRouter models',
    },
};