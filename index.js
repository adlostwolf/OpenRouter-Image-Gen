import { eventSource, event_types, getRequestHeaders } from '../../../../script.js';

const MODULE_NAME = 'openrouter_image_gen';

let panel = null;
let availableModels = [];

async function fetchAvailableModels(apiKey) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch models from OpenRouter');
            return [];
        }

        const data = await response.json();
        // Return all models so user can select image models manually
        return data.data.map(m => ({
            id: m.id,
            name: m.name || m.id,
        }));
    } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
        return [];
    }
}

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
                headers: getRequestHeaders(),
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
        model: '',
    };
    return context.extensionSettings[MODULE_NAME];
}

async function addPanel() {
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
            <button onclick="loadModels()">Load Models</button>
        </div>
        <div class="image-gen-field">
            <label for="model-select">Model:</label>
            <select id="model-select">
                <option value="">-- Select a model after loading --</option>
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
    // @ts-ignore
    window.loadModels = loadModels;

    // Auto-load models if API key is already set
    if (settings.apiKey) {
        await loadModels();
    }
}

async function loadModels() {
    // @ts-ignore
    const apiKey = document.getElementById('api-key').value;

    if (!apiKey) {
        alert('Please enter your OpenRouter API key first.');
        return;
    }

    // @ts-ignore
    const modelSelect = document.getElementById('model-select');
    modelSelect.innerHTML = '<option value="">Loading models...</option>';

    availableModels = await fetchAvailableModels(apiKey);

    if (availableModels.length === 0) {
        modelSelect.innerHTML = '<option value="">No models found. Check your API key.</option>';
        return;
    }

    const settings = getSettings();
    modelSelect.innerHTML = availableModels.map(model =>
        `<option value="${model.id}" ${model.id === settings.model ? 'selected' : ''}>${model.name}</option>`
    ).join('');
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
    // @ts-ignore
    const apiKey = document.getElementById('api-key').value;
    // @ts-ignore
    const model = document.getElementById('model-select').value;
    // @ts-ignore
    const prompt = document.getElementById('prompt').value;

    // Validate inputs with specific error messages
    if (!apiKey) {
        alert('Please enter your OpenRouter API key.');
        return;
    }

    if (!model) {
        alert('Please load models and select a model.');
        return;
    }

    if (!prompt) {
        alert('Please enter a prompt.');
        return;
    }

    // Auto-save settings before generating
    const context = SillyTavern.getContext();
    context.extensionSettings[MODULE_NAME] = {
        apiKey: apiKey,
        model: model,
    };
    context.saveSettingsDebounced();

    try {
        const response = await fetch('/api/plugins/openrouter-image-gen/generate', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                prompt,
                model: model,
                apiKey: apiKey,
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
