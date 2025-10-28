import { eventSource, event_types } from '../../../script.js';

const MODULE_NAME = 'openrouter_image_gen';

let panel = null;

// List of OpenRouter image models (can be expanded)
const imageModels = [
    'openai/dall-e-3',
    'openai/dall-e-2',
    'stability-ai/stable-diffusion-xl-1024-v1-0',
    'stability-ai/sdxl-1.0',
    'midjourney/midjourney',
    // Add more as needed
];

function init() {
    eventSource.on(event_types.APP_READY, () => {
        registerImageGenerator();
        addPanel();
    });
}

function registerImageGenerator() {
    const context = SillyTavern.getContext();
    context.imageGenExtensions = context.imageGenExtensions || [];
    context.imageGenExtensions.push({
        name: 'OpenRouter Image Gen',
        generate: async (prompt, negative, width, height) => {
            const settings = getSettings();
            if (!settings.apiKey || !settings.model) {
                throw new Error('API key and model not set in OpenRouter Image Gen extension settings.');
            }

            const response = await fetch('/api/plugins/openrouter-image-gen/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt + (negative ? `, negative: ${negative}` : ''),
                    model: settings.model,
                    apiKey: settings.apiKey,
                    // Add size if supported
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const data = await response.json();
            if (data.data && data.data[0] && data.data[0].url) {
                return { url: data.data[0].url };
            } else {
                throw new Error('No image generated');
            }
        },
    });
}

function getSettings() {
    const context = SillyTavern.getContext();
    context.extensionSettings[MODULE_NAME] = context.extensionSettings[MODULE_NAME] || {
        apiKey: '',
        model: imageModels[0],
    };
    return context.extensionSettings[MODULE_NAME];
}

function addPanel() {
    const container = document.querySelector('#extensions_settings');
    if (!container) return;

    const settings = getSettings();

    panel = document.createElement('div');
    panel.className = 'openrouter-image-gen-panel';
    panel.innerHTML = `
        <h3>OpenRouter Image Generation</h3>
        <div class="image-gen-field">
            <label for="api-key">OpenRouter API Key:</label>
            <input type="password" id="api-key" value="${settings.apiKey}" placeholder="Enter your OpenRouter API key">
        </div>
        <div class="image-gen-field">
            <label for="model-select">Model:</label>
            <select id="model-select">
                ${imageModels.map(model => `<option value="${model}" ${model === settings.model ? 'selected' : ''}>${model}</option>`).join('')}
            </select>
        </div>
        <div class="image-gen-field">
            <button onclick="saveSettings()">Save Settings</button>
        </div>
        <div class="image-gen-field">
            <label for="prompt">Prompt:</label>
            <textarea id="prompt" rows="3" placeholder="Describe the image you want to generate"></textarea>
        </div>
        <div class="image-gen-field">
            <button onclick="generateImage()">Generate Image</button>
        </div>
        <div id="image-container"></div>
    `;

    container.appendChild(panel);

    // Make functions global
    // @ts-ignore
    window.saveSettings = saveSettings;
    // @ts-ignore
    window.generateImage = generateImage;
}

function saveSettings() {
    const context = SillyTavern.getContext();
    context.extensionSettings[MODULE_NAME] = {
        // @ts-ignore
        apiKey: document.getElementById('api-key').value,
        // @ts-ignore
        model: document.getElementById('model-select').value,
    };
    context.saveSettingsDebounced();
    alert('Settings saved!');
}

async function generateImage() {
    const settings = getSettings();
    // @ts-ignore
    const prompt = document.getElementById('prompt').value;

    if (!settings.apiKey || !settings.model || !prompt) {
        alert('Please save settings and enter a prompt.');
        return;
    }

    try {
        const response = await fetch('/api/plugins/openrouter-image-gen/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                model: settings.model,
                apiKey: settings.apiKey,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            alert('Error: ' + error.error);
            return;
        }

        const data = await response.json();
        displayImage(data);
    } catch (error) {
        console.error('Generation failed:', error);
        alert('Generation failed. Check console for details.');
    }
}

function displayImage(data) {
    const container = document.getElementById('image-container');
    container.innerHTML = '';

    if (data.data && data.data[0] && data.data[0].url) {
        const img = document.createElement('img');
        img.src = data.data[0].url;
        img.className = 'generated-image';
        img.alt = 'Generated Image';
        container.appendChild(img);
    } else {
        container.innerHTML = '<p>No image generated.</p>';
    }
}

init();