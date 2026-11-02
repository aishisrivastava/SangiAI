import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const BASE = 'https://api.sarvam.ai';

const json = (data, status) => Response.json(data, { status });

// Model IDs come from env with safe defaults, resolved per request so a missing
// secret can never crash boot.
// Model ids are pinned here so a demo never depends on a secret being right.
// bulbul:v3 is the multilingual voice family (all eight app languages), and
// saaras:v3 is the current speech-to-text model.
const models = () => ({
  stt: 'saaras:v3',
  tts: 'bulbul:v3',
  translate: 'sarvam-translate:v1',
});

const apiKey = () => {
  const key = secrets.get('SARVAM_API_KEY');
  if (!key) throw new Error('missing_sarvam_key');
  return key;
};

export default async function (req) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const body = await req.json().catch(() => ({}));
  const action = body.action;
  if (!action) return json({ error: 'action is required' }, 400);

  let key;
  try {
    key = apiKey();
  } catch (error) {
    return json({ error: 'voice_unavailable', detail: 'SARVAM_API_KEY is not set' }, 503);
  }

  const MODEL = models();

  try {
    if (action === 'stt') {
      const base64 = String(body.audio_base64 || '');
      if (!base64) return json({ error: 'audio_base64 is required' }, 400);
      if (base64.length > 12000000) return json({ error: 'audio too large' }, 413);

      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const mime = String(body.mime || 'audio/webm');
      const form = new FormData();
      form.append('file', new Blob([bytes], { type: mime }), mime.includes('mp4') ? 'audio.mp4' : 'audio.webm');
      form.append('model', MODEL.stt);
      form.append('mode', 'transcribe');
      form.append('language_code', body.language_code || 'unknown');

      const response = await fetch(`${BASE}/speech-to-text`, {
        method: 'POST',
        headers: { 'api-subscription-key': key },
        body: form,
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return json({ error: 'stt_failed', status: response.status, detail: data?.error?.message || null }, 502);
      }
      return json({
        transcript: data.transcript || '',
        language_code: data.language_code || body.language_code || null,
      });
    }

    if (action === 'tts') {
      const text = String(body.text || '').slice(0, 2400);
      if (!text.trim()) return json({ error: 'text is required' }, 400);

      const payload = {
        text,
        language_code: body.language_code || 'hi-IN',
        model: MODEL.tts,
        speaker: body.speaker || 'priya',
        output_audio_codec: 'wav',
      };

      let response = await fetch(`${BASE}/text-to-speech`, {
        method: 'POST',
        headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok && response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        response = await fetch(`${BASE}/text-to-speech`, {
          method: 'POST',
          headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(25000),
        });
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return json(
          {
            error: 'tts_failed',
            status: response.status,
            detail: data?.error?.message || data?.detail || data?.message || null,
          },
          502,
        );
      }
      const audio = (data.audios && data.audios.join('')) || data.audio || null;
      if (!audio) return json({ error: 'tts_empty' }, 502);
      return json({ audio_base64: audio, mime: 'audio/wav' });
    }

    if (action === 'translate') {
      const text = String(body.text || '').slice(0, 900);
      if (!text.trim()) return json({ error: 'text is required' }, 400);
      const target = body.target_language_code || 'hi-IN';
      const source = body.source_language_code || 'auto';

      const response = await fetch(`${BASE}/translate`, {
        method: 'POST',
        headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          source_language_code: source,
          target_language_code: target,
          model: MODEL.translate,
          // sarvam-translate only accepts 'formal'; mayura adds colloquial modes.
          mode: String(MODEL.translate).includes('mayura') ? 'modern-colloquial' : 'formal',
        }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return json(
          {
            error: 'translate_failed',
            status: response.status,
            detail: data?.error?.message || data?.detail || data?.message || null,
          },
          502,
        );
      }
      return json({
        translated: data.translated_text || data.translatedText || null,
        source_language_code: data.source_language_code || source,
        target_language_code: target,
      });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (error) {
    return json({ error: 'sarvam_error', detail: String(error?.message || error) }, 502);
  }
}