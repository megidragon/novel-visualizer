/**
 * Test script to verify Piper TTS and ffmpeg are working.
 * Run: npx tsx scripts/test-tts.ts
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const exec = promisify(execFile);

const PIPER = process.env.PIPER_EXECUTABLE_PATH || 'piper';
const MODEL = process.env.PIPER_MODEL_PATH || '';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const OUT_DIR = path.resolve(__dirname, '../novels/temp');

const TEST_TEXT = 'The ancient cultivator descended from the mountain peak, his robes flowing in the cold wind.';

async function testFfmpeg() {
  console.log('\n--- Testing ffmpeg ---');
  console.log(`Path: ${FFMPEG}`);
  try {
    const { stdout } = await exec(FFMPEG, ['-version']);
    const firstLine = stdout.split('\n')[0];
    console.log(`OK: ${firstLine}`);
    return true;
  } catch (err) {
    console.error(`FAIL: ffmpeg not found at "${FFMPEG}"`);
    console.error('  Install: winget install ffmpeg');
    console.error(`  Error: ${(err as Error).message}`);
    return false;
  }
}

async function testPiper() {
  console.log('\n--- Testing Piper TTS ---');
  console.log(`Executable: ${PIPER}`);
  console.log(`Model: ${MODEL}`);

  if (!MODEL || MODEL.includes('/path/to/')) {
    console.error('FAIL: PIPER_MODEL_PATH not configured in .env');
    console.error('  1. Download Piper: https://github.com/rhasspy/piper/releases');
    console.error('  2. Download a voice model: https://huggingface.co/rhasspy/piper-voices/tree/main');
    console.error('  3. Set PIPER_EXECUTABLE_PATH and PIPER_MODEL_PATH in .env');
    return false;
  }

  try {
    await fs.access(PIPER);
  } catch {
    console.error(`FAIL: Piper executable not found at "${PIPER}"`);
    return false;
  }

  try {
    await fs.access(MODEL);
  } catch {
    console.error(`FAIL: Voice model not found at "${MODEL}"`);
    return false;
  }

  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const textFile = path.join(OUT_DIR, 'test_input.txt');
    const wavFile = path.join(OUT_DIR, 'test_output.wav');

    await fs.writeFile(textFile, TEST_TEXT, 'utf-8');
    console.log(`Synthesizing: "${TEST_TEXT.slice(0, 50)}..."`);

    const start = Date.now();
    await exec(PIPER, [
      '--model', MODEL,
      '--output_file', wavFile,
      '--input_file', textFile,
    ]);
    const elapsed = Date.now() - start;

    const stat = await fs.stat(wavFile);
    console.log(`OK: WAV generated (${(stat.size / 1024).toFixed(1)} KB) in ${elapsed}ms`);

    // Parse WAV duration from header
    const buf = await fs.readFile(wavFile);
    if (buf.length >= 44) {
      const byteRate = buf.readUInt32LE(28);
      const duration = (buf.length - 44) / byteRate;
      console.log(`   Duration: ${duration.toFixed(2)}s`);
    }

    // Cleanup text file, keep WAV for ffmpeg test
    await fs.unlink(textFile);
    return true;
  } catch (err) {
    console.error(`FAIL: Piper synthesis failed`);
    console.error(`  Error: ${(err as Error).message}`);
    return false;
  }
}

async function testWavToMp3() {
  console.log('\n--- Testing WAV to MP3 conversion ---');
  const wavFile = path.join(OUT_DIR, 'test_output.wav');
  const mp3File = path.join(OUT_DIR, 'test_output.mp3');

  try {
    await fs.access(wavFile);
  } catch {
    console.error('SKIP: No WAV file from Piper test');
    return false;
  }

  try {
    const start = Date.now();
    await exec(FFMPEG, [
      '-i', wavFile,
      '-codec:a', 'libmp3lame',
      '-b:a', '128k',
      '-ac', '1',
      '-y',
      mp3File,
    ]);
    const elapsed = Date.now() - start;

    const stat = await fs.stat(mp3File);
    console.log(`OK: MP3 generated (${(stat.size / 1024).toFixed(1)} KB) in ${elapsed}ms`);
    console.log(`   Output: ${mp3File}`);

    // Cleanup WAV
    await fs.unlink(wavFile);
    return true;
  } catch (err) {
    console.error(`FAIL: WAV to MP3 conversion failed`);
    console.error(`  Error: ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  console.log('=== Novel Visualizer - TTS Test ===');

  const ffmpegOk = await testFfmpeg();
  const piperOk = await testPiper();
  let mp3Ok = false;

  if (ffmpegOk && piperOk) {
    mp3Ok = await testWavToMp3();
  }

  console.log('\n=== Results ===');
  console.log(`ffmpeg:    ${ffmpegOk ? 'PASS' : 'FAIL'}`);
  console.log(`Piper TTS: ${piperOk ? 'PASS' : 'FAIL'}`);
  console.log(`WAV->MP3:  ${mp3Ok ? 'PASS' : 'FAIL'}`);

  if (ffmpegOk && piperOk && mp3Ok) {
    console.log('\nAll checks passed! TTS pipeline is ready.');
    console.log(`Test MP3: ${path.join(OUT_DIR, 'test_output.mp3')}`);
  } else {
    console.log('\nSome checks failed. Fix the issues above and retry.');
    process.exit(1);
  }
}

main();
