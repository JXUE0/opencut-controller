# OpenCut Controller - Prompt Templates Guide

This document provides detailed examples and usage patterns for the 3 MCP Prompt templates available in opencut-controller. Agents should use these prompts as starting points for common video editing tasks.

## Available Prompt Templates

### 1. `create_intro_video`
Creates a 10-second intro video with text overlay.

**Purpose:** Quick template for generating introductory videos with animated text.

**Arguments:**
- `text` (required) - Text to display
- `duration` (optional) - Duration in seconds (default: 10)

**Example 1: Basic Intro**
```json
{
  "name": "create_intro_video",
  "arguments": {
    "text": "Welcome to My Channel"
  }
}
```

**Agent workflow for this prompt:**
1. Parse the prompt text returned by `GetPromptRequestSchema`
2. Execute the steps described:
   - Call `project_new` to create a new project
   - Call `text_add` to add text element with specified text
   - Call `timeline_element_update` to set font size to 48
   - Call `timeline_element_update` to center position (x: 960, y: 540 for 1080p)
   - Call `timeline_effect_add` to add fade-in effect
   - Call `timeline_element_trim_end` to set duration to 10 seconds

**Example 2: Custom Duration**
```json
{
  "name": "create_intro_video",
  "arguments": {
    "text": "Game Highlights",
    "duration": 15
  }
}
```

**Text positioning reference:**
- 1080p center: x=960, y=540
- 720p center: x=640, y=360
- Use `canvas_set_resolution` to check or set project resolution first

---

### 2. `add_background_music`
Searches and adds background music to the timeline.

**Purpose:** Automates the workflow of finding and adding background music to a project.

**Arguments:**
- `query` (required) - Search query for music (e.g., "upbeat", "calm", "electronic")
- `duration` (optional) - Duration to trim in seconds (default: 30)

**Example 1: Upbeat Music**
```json
{
  "name": "add_background_music",
  "arguments": {
    "query": "upbeat corporate"
  }
}
```

**Agent workflow for this prompt:**
1. Parse the prompt text returned
2. Execute the described workflow:
   - Call `audio_sound_search` with the query
   - Parse the results array from the response
   - Take the first result (index 0)
   - Call `audio_sound_add_to_timeline` with the sound ID
   - If duration specified and less than track duration, call `audio_trim` to trim

**Example 2: Calm Background Music with Duration**
```json
{
  "name": "add_background_music",
  "arguments": {
    "query": "calm piano",
    "duration": 60
  }
}
```

**Search query suggestions:**
- "upbeat pop" - Energetic, positive music
- "calm ambient" - Relaxing background music
- "electronic dance" - EDM tracks
- "cinematic orchestra" - Epic orchestral music
- "jazz lounge" - Smooth jazz tracks

**Note:** The `audio_sound_search` tool returns an array of results. Always check the response structure:
```typescript
const results = JSON.parse(response.content[0].text);
const firstTrack = results[0];
```

---

### 3. `apply_transition`
Applies a transition effect between two clips on the timeline.

**Purpose:** Simplifies the process of adding transitions between timeline elements.

**Arguments:**
- `effect` (required) - Effect name (e.g., "fade", "dissolve", "wipe", "slide")
- `duration` (optional) - Transition duration in seconds (default: 1)

**Example 1: Simple Fade Transition**
```json
{
  "name": "apply_transition",
  "arguments": {
    "effect": "fade"
  }
}
```

**Agent workflow for this prompt:**
1. Parse the prompt text
2. Execute the workflow:
   - Call `timeline_element_list` to get all elements
   - Identify the last two elements (by `startTime` or position)
   - Call `timeline_effect_add` with:
     - `elementId`: ID of the second element (transition applies to start of element)
     - `effectType`: "transition"
     - `effectName`: the specified effect
     - `duration`: specified duration
     - `parameters`: effect-specific parameters (if any)

**Example 2: Dissolve with Custom Duration**
```json
{
  "name": "apply_transition",
  "arguments": {
    "effect": "dissolve",
    "duration": 2
  }
}
```

**Available transition effects:**
- `fade` - Simple opacity fade (default)
- `dissolve` - Cross dissolve between clips
- `wipe` - Direction-based wipe (requires `direction` parameter)
- `slide` - Slide transition (requires `direction` parameter)
- `zoom` - Zoom transition
- `blur` - Blur transition

**Effect-specific parameters example (wipe):**
```json
{
  "effect": "wipe",
  "duration": 1.5,
  "parameters": {
    "direction": "left-to-right"
  }
}
```

---

## Agent Usage Patterns

### How to Use Prompts in Your Agent

**Step 1: List Available Prompts**
```typescript
// Call ListPromptsRequestSchema
const prompts = await server.listPrompts();
console.log(prompts.prompts);
```

**Step 2: Get a Specific Prompt with Arguments**
```typescript
// Call GetPromptRequestSchema with name and arguments
const promptResult = await server.getPrompt({
  name: "create_intro_video",
  arguments: {
    text: "Hello World",
    duration: 10
  }
});

// The result contains messages array with the prompt text
const promptText = promptResult.messages[0].content.text;
console.log(promptText);
```

**Step 3: Parse and Execute the Prompt**

The prompt text is a natural language description of steps. Agents should:
1. Parse the text to extract tool names and parameters
2. Execute each step sequentially
3. Handle errors and retries
4. Report progress back to the user

**Example parsing logic:**
```typescript
function parsePromptSteps(promptText: string): Array<{tool: string, params: Record<string, unknown>}> {
  const steps = [];
  const lines = promptText.split('\n');
  
  for (const line of lines) {
    // Look for tool names in the text (they contain underscores)
    const toolMatch = line.match(/(\w+_\w+)/);
    if (toolMatch) {
      const toolName = toolMatch[1];
      // Extract parameters from context
      // This is a simplified example - real parsing would be more robust
      steps.push({ tool: toolName, params: {} });
    }
  }
  
  return steps;
}
```

---

## Complete Workflow Example

**User Request:** "Create a 10-second intro video with text 'Welcome' and add background music"

**Agent Steps:**
1. Call `GetPromptRequestSchema` for `create_intro_video` with `text: "Welcome"`
2. Parse prompt text, execute steps:
   - `project_new` → create project
   - `text_add` → add "Welcome" text
   - `timeline_element_update` → set font size 48, center position
   - `timeline_effect_add` → add fade-in
3. Call `GetPromptRequestSchema` for `add_background_music` with `query: "upbeat"`
4. Parse prompt text, execute steps:
   - `audio_sound_search` → search "upbeat"
   - `audio_sound_add_to_timeline` → add first result
5. Report completion to user

---

## Tips for Agents

1. **Always check tool responses** - Parse JSON from `content[0].text` to get result data
2. **Handle errors gracefully** - If a tool fails, retry or suggest alternative approach
3. **Chain prompts together** - Use multiple prompts in sequence for complex tasks
4. **Verify state** - Use Resources (`opencut://editor/state`) to check current state before/after operations
5. **Progress reporting** - Inform user of each step being executed

---

## Prompt Templates Summary

| Prompt Name | Purpose | Required Args | Optional Args |
|-------------|---------|---------------|---------------|
| `create_intro_video` | Create intro with text overlay | `text` | `duration` (default: 10) |
| `add_background_music` | Search and add background music | `query` | `duration` (default: 30) |
| `apply_transition` | Apply transition between clips | `effect` | `duration` (default: 1) |

---

## Extending Prompts

To add new prompt templates, edit `src/index.ts` and add to the `PROMPTS` array:

```typescript
const PROMPTS = [
  // ... existing prompts
  {
    name: "your_new_prompt",
    description: "Description of what this prompt does",
    arguments: [
      { name: "param1", description: "Description", required: true },
      { name: "param2", description: "Description", required: false },
    ],
  },
];

// Also update getPromptContent function to handle the new prompt
function getPromptContent(name: string, args: Record<string, unknown>): string {
  if (name === "your_new_prompt") {
    // Return prompt text with instructions
    return `Steps to execute: ...`;
  }
  // ... existing prompts
}
```
