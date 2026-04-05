import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { config } from '../../config.js';

const execFileAsync = promisify(execFile);

export async function getWavDuration(wavPath: string): Promise<number> {
  const buffer = await fs.readFile(wavPath);

  // Parse WAV header: bytes 24-27 = sample rate, bytes 28-31 = byte rate
  if (buffer.length < 44) return 0;

  const byteRate = buffer.readUInt32LE(28);
  const dataSize = buffer.length - 44; // subtract header size

  if (byteRate === 0) return 0;
  return dataSize / byteRate;
}

export async function concatenateWavFiles(
  wavPaths: string[],
  outputPath: string,
  silenceGapSeconds: number,
): Promise<void> {
  // Use ffmpeg to concatenate with silence gaps
  // Build filter: input files + silence between them
  const inputs: string[] = [];
  const filterParts: string[] = [];

  for (let i = 0; i < wavPaths.length; i++) {
    inputs.push('-i', wavPaths[i]);
  }

  // Build filter complex: concatenate with silence
  let filterComplex = '';
  const segments: string[] = [];

  for (let i = 0; i < wavPaths.length; i++) {
    segments.push(`[${i}:a]`);
    if (i < wavPaths.length - 1) {
      // Add silence between segments
      filterComplex += `aevalsrc=0:d=${silenceGapSeconds}[s${i}];`;
      segments.push(`[s${i}]`);
    }
  }

  filterComplex += `${segments.join('')}concat=n=${segments.length}:v=0:a=1[out]`;

  await execFileAsync(config.ffmpegPath, [
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[out]',
    '-y',
    outputPath,
  ]);
}

export async function convertWavToMp3(wavPath: string, mp3Path: string): Promise<void> {
  await execFileAsync(config.ffmpegPath, [
    '-i', wavPath,
    '-codec:a', 'libmp3lame',
    '-b:a', '128k',
    '-ac', '1', // mono
    '-y',
    mp3Path,
  ]);
}

export async function cleanupTempFiles(paths: string[]): Promise<void> {
  for (const p of paths) {
    await fs.unlink(p).catch(() => {});
  }
}
