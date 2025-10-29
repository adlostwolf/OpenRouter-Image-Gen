# OpenRouter Image Generation Extension for SillyTavern

This extension integrates OpenRouter's image generation models into SillyTavern, allowing you to generate images directly within the chat interface using various AI models like DALL-E 3, Stable Diffusion, and Midjourney.

## Features

- Generate images using multiple OpenRouter-supported models
- Integrated into SillyTavern's chat system for context-aware image generation
- Settings panel for API key and model selection
- Direct image generation from the extensions settings page

## Installation

1. In SillyTavern, go to the Extensions panel
2. Click "Install Extension"
3. Enter the repository URL: `https://github.com/adlostwolf/OpenRouter-Image-Gen`
4. The extension and server plugin will be installed automatically

## Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. In SillyTavern, go to Extensions Settings
3. Find the "OpenRouter Image Generation" section
4. Enter your API key and select your preferred model
5. Click "Save Settings"
6. Make sure to enable the `openrouter-image-gen` server plugin in your plugins settings

## Usage

### In Chat
- Use the image generation feature in chat as you normally would in SillyTavern
- Select "OpenRouter Image Gen" as your image generation source
- The extension will use your selected OpenRouter model to generate images

### Direct Generation
- Go to Extensions Settings > OpenRouter Image Generation
- Enter a prompt in the text area
- Click "Generate Image" to create an image directly

## Supported Models

- OpenAI DALL-E 3
- OpenAI DALL-E 2
- Stability AI Stable Diffusion XL
- Midjourney

More models can be added by updating the `imageModels` array in `index.js`.

## Server Plugin

This extension includes a server plugin that handles API calls securely. The plugin will be automatically installed in your `plugins/openrouter-image-gen/` directory. Make sure it's enabled in your SillyTavern plugins settings.

## Requirements

- SillyTavern v1.10.0 or higher
- OpenRouter API key
- Server plugin enabled: `openrouter-image-gen`