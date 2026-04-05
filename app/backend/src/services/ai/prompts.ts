import type { StyleTheme } from '@novel-visualizer/shared';

export function getActSplitterPrompt(style: StyleTheme): string {
  return `You are a literary analyst. Your task is to read a chunk of a novel and identify "act boundaries" — points where the narrative shifts significantly.

An act boundary occurs when:
- Characters move to a new physical location
- There is a time skip (hours, days, years)
- The narrative context shifts dramatically (e.g., flashback begins, perspective changes)
- A major event concludes and a new situation begins (e.g., battle ends, journey starts)

For each boundary you identify, provide:
1. The approximate character offset in the text where the boundary occurs
2. A brief description of what changes (e.g., "Characters leave the village and enter the mountain path")
3. A summary of the act that just ended

Style context: This novel is in the "${style}" genre.
${style === 'xinxia' ? 'Pay attention to cultivation breakthroughs, sect changes, realm transitions, and martial confrontations as potential act boundaries.' : ''}
${style === 'mysterious' ? 'Pay attention to location shifts, revelation moments, investigation phases, and atmosphere changes as potential act boundaries.' : ''}

Respond with a JSON array of boundaries:
[
  {
    "charOffset": <number>,
    "description": "<what changes at this boundary>",
    "actSummary": "<summary of the act that just ended>"
  }
]

If there are no clear boundaries in this chunk, respond with an empty array [].`;
}

export function getSceneDesignPrompt(style: StyleTheme): string {
  const styleGuide = style === 'xinxia'
    ? `Xinxia Style Guide:
- Use warm colors: golds (#FFD700), reds (#B22222), jade greens (#00A86B)
- Architecture: Chinese temples, pagodas, mountain pavilions
- Props: incense burners, cultivation mats, spirit stones, jade pillars, lanterns
- Lighting: mystical glows for cultivation scenes, warm dawn for peaceful moments
- Character poses: meditating for cultivation, fighting for combat, standing for dialogue
- Weapons: swords, flying swords, staffs, spiritual artifacts`
    : `Mysterious Style Guide:
- Use dark colors: deep purples (#2D1B69), dark blues (#1B2838), silver (#C0C0C0), crimson (#8B0000)
- Architecture: Gothic buildings, ancient ruins, dark libraries
- Props: candelabras, old books, mirrors, fog, cobwebs, iron gates
- Lighting: ominous for tension, night for stealth, mystical for supernatural
- Character poses: standing for investigation, walking for exploration, kneeling for discovery
- Weapons: daggers, occult items, lanterns`;

  return `You are a scene designer for an audiovisual novel experience. Given a narrative act, you must design an isometric 3D scene.

${styleGuide}

## Coordinate System
- The scene is rendered on a grid. X goes left-right, Y goes up (height), Z goes forward-backward.
- Center of the scene is (0, 0, 0). Keep positions within -5 to 5 on X and Z axes.
- Y=0 is ground level. Characters stand at Y=0 unless on elevated terrain.
- Characters should be spaced at least 1 unit apart.

## Character Appearances
- bodyType: choose from male_tall, male_average, female_tall, female_average, elder, child
- robeColor: hex color string (e.g., "#8B0000")
- hairColor: hex color string
- hairStyle: long, short, bun, or bald
- hasWeapon: "sword", "staff", or omit for none
- facing: direction the character faces (north, south, east, west, or camera)

## Dialogue Entries
For each text entry in the scene:
- "narration" type: third-person prose describing what happens. character should be null.
- "dialogue" type: words spoken by a character. character must match a character name.
- "thought" type: inner thoughts of a character. character must match a character name.
- Estimate startTime/endTime based on ~150 words per minute for narration, ~180 wpm for dialogue.
- Entries must be in chronological order with no overlapping times.
- Start narration at time 0.

## Environment
- terrain: choose from mountain_peak, forest_clearing, temple_hall, cave, village_street, throne_room, battlefield, library, garden, dungeon, open_field
- skyColor and ambientColor: hex strings matching the mood
- props: array of objects placed in the scene (trees, rocks, pillars, altars, torches, etc.)

You must respond with a valid JSON object matching the SceneSpec schema (without id, projectId, audioFile, or durationSeconds — those are filled later).`;
}

export function getCharacterRegistryPrompt(): string {
  return `While analyzing this novel, build a character registry. For each named character that appears, record:
- name: their name as it appears most commonly
- appearance: physical description based on the text
- role: protagonist, antagonist, side character, etc.

Return as JSON:
[
  {
    "name": "<character name>",
    "appearance": { "bodyType": "...", "robeColor": "#...", "hairColor": "#...", "hairStyle": "...", "hasWeapon": "..." },
    "role": "<role>"
  }
]`;
}
