import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type { DialogueEntry } from '@novel-visualizer/shared';
import { config } from '../../config.js';
import { getWavDuration, concatenateWavFiles, convertWavToMp3, cleanupTempFiles } from './audio-utils.js';

const execFileAsync = promisify(execFile);

export class PiperTTS {
  private piperPath: string;
  private modelPath: string;

  constructor() {
    this.piperPath = config.piperPath;
    this.modelPath = config.piperModelPath;
  }

  async synthesizeText(text: string, outputWavPath: string): Promise<number> {
    // Write text to temp file (more reliable on Windows than piping)
    const textFile = outputWavPath + '.txt';
    await fs.writeFile(textFile, text, 'utf-8');

    try {
      await execFileAsync(this.piperPath, [
        '--model', this.modelPath,
        '--output_file', outputWavPath,
        '--input_file', textFile,
      ]);

      const duration = await getWavDuration(outputWavPath);
      return duration;
    } finally {
      await fs.unlink(textFile).catch(() => {});
    }
  }

  async synthesizeScene(
    texts: DialogueEntry[],
    outputMp3Path: string,
  ): Promise<{ durationSeconds: number; texts: DialogueEntry[] }> {
    const tempDir = path.dirname(outputMp3Path);
    const wavFiles: string[] = [];
    const updatedTexts: DialogueEntry[] = [];
    let currentTime = 0;
    const SILENCE_GAP = 0.5; // seconds between entries

    for (let i = 0; i < texts.length; i++) {
      const entry = texts[i];
      const wavPath = path.join(tempDir, `tts_${uuid()}.wav`);
      wavFiles.push(wavPath);

      const duration = await this.synthesizeText(entry.text, wavPath);

      updatedTexts.push({
        ...entry,
        startTime: currentTime,
        endTime: currentTime + duration,
      });

      currentTime += duration + SILENCE_GAP;
    }

    // Concatenate all WAVs
    const combinedWav = path.join(tempDir, `combined_${uuid()}.wav`);
    if (wavFiles.length === 1) {
      await fs.copyFile(wavFiles[0], combinedWav);
    } else {
      await concatenateWavFiles(wavFiles, combinedWav, SILENCE_GAP);
    }

    // Convert to MP3
    await convertWavToMp3(combinedWav, outputMp3Path);

    const totalDuration = currentTime - SILENCE_GAP; // remove trailing gap

    // Cleanup temp files
    await cleanupTempFiles([...wavFiles, combinedWav]);

    return {
      durationSeconds: Math.max(totalDuration, 0),
      texts: updatedTexts,
    };
  }
}
