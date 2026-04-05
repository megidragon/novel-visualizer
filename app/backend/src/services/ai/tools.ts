import type OpenAI from 'openai';

export const analyzeSceneTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'AnalyzeScene',
    description:
      'Analyze a narrative fragment to understand the setting, characters present, their positions, mood, and key events. Use this before DesignScene to plan the visual layout.',
    parameters: {
      type: 'object',
      properties: {
        setting: {
          type: 'string',
          description: 'Description of the physical location and environment',
        },
        mood: {
          type: 'string',
          description: 'The emotional tone (tense, peaceful, mysterious, epic, etc.)',
        },
        characters_present: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              action: { type: 'string', description: 'What the character is doing' },
              position_hint: { type: 'string', description: 'Where they are relative to others (center, left, far back, etc.)' },
            },
            required: ['name', 'action'],
          },
          description: 'Characters that appear in this scene',
        },
        key_events: {
          type: 'array',
          items: { type: 'string' },
          description: 'Main events in chronological order',
        },
      },
      required: ['setting', 'mood', 'characters_present', 'key_events'],
    },
  },
};

export const designSceneTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'DesignScene',
    description:
      'Generate a complete visual scene specification. Call AnalyzeScene first to plan, then use this to produce the final scene layout with environment, character placements, and timed dialogue.',
    parameters: {
      type: 'object',
      properties: {
        sequence: { type: 'number', description: 'Scene order number (1-indexed)' },
        environment: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            terrain: {
              type: 'string',
              enum: [
                'mountain_peak', 'forest_clearing', 'temple_hall', 'cave',
                'village_street', 'throne_room', 'battlefield', 'library',
                'garden', 'dungeon', 'open_field',
              ],
            },
            lighting: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['dawn', 'day', 'dusk', 'night', 'mystical', 'ominous'] },
                intensity: { type: 'number' },
                directionalAngle: { type: 'number' },
              },
              required: ['type', 'intensity', 'directionalAngle'],
            },
            props: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  position: {
                    type: 'object',
                    properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
                    required: ['x', 'y', 'z'],
                  },
                  scale: { type: 'number' },
                },
                required: ['type', 'position', 'scale'],
              },
            },
            skyColor: { type: 'string' },
            ambientColor: { type: 'string' },
          },
          required: ['description', 'terrain', 'lighting', 'props', 'skyColor', 'ambientColor'],
        },
        characters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              position: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
                required: ['x', 'y', 'z'],
              },
              facing: { type: 'string', enum: ['north', 'south', 'east', 'west', 'camera'] },
              appearance: {
                type: 'object',
                properties: {
                  bodyType: { type: 'string', enum: ['male_tall', 'male_average', 'female_tall', 'female_average', 'elder', 'child'] },
                  robeColor: { type: 'string' },
                  hairColor: { type: 'string' },
                  hairStyle: { type: 'string', enum: ['long', 'short', 'bun', 'bald'] },
                  hasWeapon: { type: 'string' },
                },
                required: ['bodyType', 'robeColor', 'hairColor', 'hairStyle'],
              },
              pose: { type: 'string', enum: ['standing', 'sitting', 'fighting', 'meditating', 'walking', 'kneeling'] },
            },
            required: ['name', 'position', 'facing', 'appearance', 'pose'],
          },
        },
        texts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              character: { type: ['string', 'null'] },
              text: { type: 'string' },
              startTime: { type: 'number' },
              endTime: { type: 'number' },
              type: { type: 'string', enum: ['dialogue', 'narration', 'thought'] },
            },
            required: ['character', 'text', 'startTime', 'endTime', 'type'],
          },
        },
      },
      required: ['sequence', 'environment', 'characters', 'texts'],
    },
  },
};

export const allTools = [analyzeSceneTool, designSceneTool];
