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
    const SILENCE_GAP = 0.5;

    // Filter out empty/whitespace-only text entries
    const validTexts = texts.filter(t => t.text && t.text.trim().length > 0);

    if (validTexts.length === 0) {
      console.warn('[PiperTTS] No valid text entries for scene, creating silent audio');
      // Create a minimal silent MP3
      await this.createSilentMp3(outputMp3Path, 1.0);
      return { durationSeconds: 1.0, texts: [] };
    }

    for (let i = 0; i < validTexts.length; i++) {
      const entry = validTexts[i];
      const wavPath = path.join(tempDir, `tts_${uuid()}.wav`);

      try {
        const duration = await this.synthesizeText(entry.text, wavPath);
        wavFiles.push(wavPath);

        updatedTexts.push({
          ...entry,
          startTime: currentTime,
          endTime: currentTime + duration,
        });

        currentTime += duration + SILENCE_GAP;
        console.log(`[PiperTTS] Entry ${i + 1}/${validTexts.length}: ${duration.toFixed(1)}s`);
      } catch (err) {
        console.error(`[PiperTTS] Failed to synthesize entry ${i + 1}/${validTexts.length}: ${(err as Error).message}`);
        console.error(`[PiperTTS] Text was: "${entry.text.slice(0, 100)}..."`);
        // Skip this entry but continue with others
        await fs.unlink(wavPath).catch(() => {});
      }
    }

    if (wavFiles.length === 0) {
      console.warn('[PiperTTS] All entries failed, creating silent audio');
      await this.createSilentMp3(outputMp3Path, 1.0);
      return { durationSeconds: 1.0, texts: [] };
    }

    const combinedWav = path.join(tempDir, `combined_${uuid()}.wav`);
    if (wavFiles.length === 1) {
      await fs.copyFile(wavFiles[0], combinedWav);
    } else {
      await concatenateWavFiles(wavFiles, combinedWav, SILENCE_GAP);
    }

    await convertWavToMp3(combinedWav, outputMp3Path);

    const totalDuration = currentTime - SILENCE_GAP;
    await cleanupTempFiles([...wavFiles, combinedWav]);

    return {
      durationSeconds: Math.max(totalDuration, 0),
      texts: updatedTexts,
    };
  }

  private async createSilentMp3(outputPath: string, durationSeconds: number): Promise<void> {
    await execFileAsync(config.ffmpegPath, [
      '-f', 'lavfi',
      '-i', `anullsrc=r=22050:cl=mono`,
      '-t', String(durationSeconds),
      '-codec:a', 'libmp3lame',
      '-b:a', '128k',
      '-y',
      outputPath,
    ]);
  }
}
