import type { SceneSpec } from '@novel-visualizer/shared';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSceneSpec(input: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (typeof input.sequence !== 'number') {
    errors.push('sequence must be a number');
  }

  // Validate environment
  const env = input.environment as Record<string, unknown> | undefined;
  if (!env) {
    errors.push('environment is required');
  } else {
    if (!env.terrain) errors.push('environment.terrain is required');
    if (!env.lighting) errors.push('environment.lighting is required');
    if (!env.skyColor) errors.push('environment.skyColor is required');
    if (!Array.isArray(env.props)) errors.push('environment.props must be an array');
  }

  // Validate characters
  const chars = input.characters as Record<string, unknown>[] | undefined;
  if (!Array.isArray(chars)) {
    errors.push('characters must be an array');
  } else {
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (!c.name) errors.push(`characters[${i}].name is required`);
      if (!c.position) errors.push(`characters[${i}].position is required`);
      if (!c.appearance) errors.push(`characters[${i}].appearance is required`);

      // Check position bounds
      const pos = c.position as Record<string, number> | undefined;
      if (pos) {
        if (Math.abs(pos.x) > 6) errors.push(`characters[${i}].position.x=${pos.x} is out of bounds (-6 to 6)`);
        if (Math.abs(pos.z) > 6) errors.push(`characters[${i}].position.z=${pos.z} is out of bounds (-6 to 6)`);
      }
    }

    // Check for overlapping characters
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const p1 = chars[i].position as Record<string, number>;
        const p2 = chars[j].position as Record<string, number>;
        if (p1 && p2) {
          const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.z - p2.z) ** 2);
          if (dist < 0.8) {
            errors.push(`characters[${i}] and characters[${j}] are too close (distance=${dist.toFixed(2)}, min=0.8)`);
          }
        }
      }
    }
  }

  // Validate texts
  const texts = input.texts as Record<string, unknown>[] | undefined;
  if (!Array.isArray(texts)) {
    errors.push('texts must be an array');
  } else {
    const charNames = new Set((chars || []).map(c => c.name as string));

    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      if (!t.text) errors.push(`texts[${i}].text is required`);
      if (typeof t.startTime !== 'number') errors.push(`texts[${i}].startTime must be a number`);
      if (typeof t.endTime !== 'number') errors.push(`texts[${i}].endTime must be a number`);
      if ((t.startTime as number) >= (t.endTime as number)) {
        errors.push(`texts[${i}].startTime must be less than endTime`);
      }

      // Check character references
      if (t.type !== 'narration' && t.character && !charNames.has(t.character as string)) {
        errors.push(`texts[${i}].character="${t.character}" not found in characters array`);
      }

      // Check chronological order
      if (i > 0) {
        const prev = texts[i - 1];
        if ((t.startTime as number) < (prev.startTime as number)) {
          errors.push(`texts[${i}].startTime=${t.startTime} is before previous entry's startTime=${prev.startTime}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
