const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../public/sounds');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to write a simple WAV file
function writeWav(filename, samples, sampleRate = 44100) {
    const buffer = Buffer.alloc(44 + samples.length * 2);

    // RIFF chunk
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + samples.length * 2, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (Mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(samples.length * 2, 40);

    // Write samples
    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        buffer.writeInt16LE(Math.floor(s), 44 + i * 2);
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
    console.log(`Generated ${filename}`);
}

// OSCILLATORS
const sine = (t) => Math.sin(2 * Math.PI * t);
const saw = (t) => 2 * (t - Math.floor(t + 0.5));
const noise = () => Math.random() * 2 - 1;

// GENERATE SOUNDS

// 1. Click (Short Sine blip)
{
    const duration = 0.05;
    const rate = 44100;
    const samples = new Float32Array(duration * rate);
    for (let i = 0; i < samples.length; i++) {
        const t = i / rate;
        const vol = 1 - (t / duration); // Decay
        samples[i] = sine(t * 1000) * vol;
    }
    writeWav('click.wav', samples);
}

// 2. Coin (Two-tone jump)
{
    const duration = 0.4;
    const rate = 44100;
    const samples = new Float32Array(duration * rate);
    for (let i = 0; i < samples.length; i++) {
        const t = i / rate;
        const freq = t < 0.1 ? 1200 : 1800; // Jump
        const vol = 1 - (t / duration);
        samples[i] = sine(t * freq) * vol * 0.5;
    }
    writeWav('coin.wav', samples);
}

// 3. Ping (High freq bell)
{
    const duration = 0.8;
    const rate = 44100;
    const samples = new Float32Array(duration * rate);
    for (let i = 0; i < samples.length; i++) {
        const t = i / rate;
        const vol = Math.exp(-6 * t); // Exponential decay
        samples[i] = sine(t * 880) * vol * 0.5;
    }
    writeWav('ping.wav', samples);
}

// 4. Error (Low buzz saw)
{
    const duration = 0.3;
    const rate = 44100;
    const samples = new Float32Array(duration * rate);
    for (let i = 0; i < samples.length; i++) {
        const t = i / rate;
        const vol = 1 - (t / duration);
        samples[i] = saw(t * 150) * vol * 0.5;
    }
    writeWav('error.wav', samples);
}

// 5. Slash (White noise swoosh)
{
    const duration = 0.2;
    const rate = 44100;
    const samples = new Float32Array(duration * rate);
    for (let i = 0; i < samples.length; i++) {
        const t = i / rate;
        const vol = Math.sin(Math.PI * (t / duration)); // Sine envelope
        samples[i] = noise() * vol * 0.4;
    }
    writeWav('slash.wav', samples);
}
