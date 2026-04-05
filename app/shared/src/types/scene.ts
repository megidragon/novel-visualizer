export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type StyleTheme = 'xinxia' | 'mysterious';

export type TerrainType =
  | 'mountain_peak'
  | 'forest_clearing'
  | 'temple_hall'
  | 'cave'
  | 'village_street'
  | 'throne_room'
  | 'battlefield'
  | 'library'
  | 'garden'
  | 'dungeon'
  | 'open_field';

export interface LightingSpec {
  type: 'dawn' | 'day' | 'dusk' | 'night' | 'mystical' | 'ominous';
  intensity: number;
  directionalAngle: number;
}

export interface PropPlacement {
  type: string;
  position: Vec3;
  scale: number;
}

export interface EnvironmentSpec {
  description: string;
  terrain: TerrainType;
  lighting: LightingSpec;
  props: PropPlacement[];
  skyColor: string;
  ambientColor: string;
}

export interface CharacterAppearance {
  bodyType: 'male_tall' | 'male_average' | 'female_tall' | 'female_average' | 'elder' | 'child';
  robeColor: string;
  hairColor: string;
  hairStyle: 'long' | 'short' | 'bun' | 'bald';
  hasWeapon?: string;
}

export interface CharacterPlacement {
  name: string;
  position: Vec3;
  facing: 'north' | 'south' | 'east' | 'west' | 'camera';
  appearance: CharacterAppearance;
  pose: 'standing' | 'sitting' | 'fighting' | 'meditating' | 'walking' | 'kneeling';
}

export interface DialogueEntry {
  character: string | null;
  text: string;
  startTime: number;
  endTime: number;
  type: 'dialogue' | 'narration' | 'thought';
}

export interface SceneSpec {
  id: string;
  projectId: string;
  sequence: number;
  style: StyleTheme;
  environment: EnvironmentSpec;
  characters: CharacterPlacement[];
  texts: DialogueEntry[];
  audioFile: string;
  durationSeconds: number;
}
