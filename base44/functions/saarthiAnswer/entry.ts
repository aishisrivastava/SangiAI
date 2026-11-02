import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const BASE = 'https://api.sarvam.ai';
const json = (data, status) => Response.json(data, { status: status || 200 });

const ALLOWED_LANGS = ['hi', 'bn', 'mr', 'te', 'ta', 'gu', 'or', 'en'];
const SARVAM_LANG = { hi: 'hi-IN', bn: 'bn-IN', mr: 'mr-IN', te: 'te-IN', ta: 'ta-IN', gu: 'gu-IN', or: 'od-IN', en: 'en-IN' };

const EMERGENCY = /accident|hospital|police|ambulance|bleed|fire|suicide|kill|danger|beat|दुर्घटना|अस्पताल|पुलिस|खून|आग|आत्महत्या|मार|खतरा|बचाओ/i;
const RIGHTS = /wage|salary|unpaid|not paid|contractor|dues|wages|मज़दूरी|मजदूरी|तनख्वाह|वेतन|ठेकेदार|बकाया|पैसे नहीं/i;
const OFF_TOPIC = /cricket|movie|song|weather|recipe|share market|bitcoin|lottery|love|क्रिकेट|फिल्म|मौसम|प्रेम/i;

const T = {
  hi: {
    planning: (city, names) =>
      `आपके जैसे श्रमिकों के लिए हमारी सूची में ${names || 'कुछ योजनाएँ'} हैं। शहर: ${city || 'आपका शहर'}। कार्ड खोलिए तो काग़ज़ और कदम दिखेंगे। यह जानकारी है, मंज़ूरी नहीं — दफ़्तर में पुष्टि करें।`,
    rights: (city) =>
      `मज़दूरी न मिलने पर अपने दिन और रकम की अपनी डायरी रखिए। फिर ${city || 'अपने शहर'} के ज़िला श्रम कार्यालय में शिकायत ले जाइए। संगी एआई की मज़दूरी डायरी से पत्र बन जाता है। यह जानकारी है, कानूनी सलाह नहीं।`,
    emergency: 'अगर किसी की जान या सुरक्षा को खतरा है तो तुरंत 112 पर कॉल कीजिए। पुलिस, एम्बुलेंस और आग — सब 112 से जुड़ते हैं। फिर आपात स्क्रीन पर अस्पताल और थाने देखिए।',
    offTopic: 'मैं सिर्फ़ श्रमिक योजनाओं, काग़ज़ों और मज़दूरी के अधिकारों में मदद कर सकता हूँ। अपनी स्थिति बताइए, जैसे “सूरत में मुझे क्या मिल सकता है?”',
    followups: ['कौन से काग़ज़ चाहिए?', 'अगर नौकरी चली जाए तो क्या होगा?', 'श्रम कार्यालय कहाँ है?'],
    unknown: 'इस सवाल का भरोसेमंद जवाब मेरे पास मौजूद जानकारी में नहीं है। कृपया ज़िला श्रम कार्यालय में पूछिए।',
  },
  en: {
    planning: (city, names) =>
      `For a worker in your situation our list has ${names || 'some schemes'}. City: ${city || 'your city'}. Open a card to see the papers and steps. This is information, not approval — confirm at the office.`,
    rights: (city) =>
      `For unpaid wages, keep your own record of days worked and amounts received. Then take the complaint to the District Labour Office in ${city || 'your city'}. Sangi AI's wage diary can make the letter. This is information, not legal advice.`,
    emergency: 'If anyone is in danger, call 112 now. Police, ambulance and fire all connect through 112. Then open the emergency screen for the nearest hospital and police station.',
    offTopic: 'I can only help with welfare schemes, documents and wage rights for migrant workers. Tell me your situation, for example "What can I claim in Surat?"',
    followups: ['Which papers do I need?', 'What if I lose my job?', 'Where is the labour office?'],
    unknown: 'I do not have a reliable answer to that in the information I hold. Please ask at the District Labour Office.',
  },
}

function classify(query) {
  if (EMERGENCY.test(query)) return 'emergency';
  if (RIGHTS.test(query)) return 'rights';
  if (OFF_TOPIC.test(query)) return 'out_of_scope';
  return 'planning';
}

function scoreScheme(scheme, query) {
  const haystack = `${scheme.name_en} ${scheme.name_hi || ''} ${scheme.summary_en} ${scheme.category || ''}`.toLowerCase()
  const tokens = query.toLowerCase().split(/[^a-z\u0900-\u097F]+/).filter((token) => token.length > 2)
  let score = 0
  for (const token of tokens) if (haystack.includes(token)) score += 2
  if (scheme.portability === 'portable') score += 1
  return score
}

const factsFor = (scheme) =>
  [
    `- ${scheme.name_en} (${scheme.category || 'scheme'}, portability: ${scheme.portability})`,
    `  ${scheme.summary_en}`,
    scheme.documents?.length ? `  Documents: ${scheme.documents.join('; ')}` : '',
    scheme.steps_en?.length ? `  Steps: ${scheme.steps_en.join(' -> ')}` : '',
    scheme.portability === 'routed_out' ? `  Note: ${scheme.portability_note_en || 'not portable'}` : '',
  ]
    .filter(Boolean)
    .join('\n')

// Blocks anything the model should never have produced: links, phone numbers, money figures.
const looksUnsafe = (text) => /https?:\/\/|www\.|@[a-z0-9]/i.test(text) || /\b\d{5,}\b/.test(text) || /₹\s?\d/.test(text)

export default async function (req) {
  const started = Date.now();
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));

  const query = String(body.query || '').slice(0, 400).trim();
  const lang = ALLOWED_LANGS.includes(body.lang) ? body.lang : 'hi';
  const profile = body.profile && typeof body.profile === 'object' ? body.profile : {};
  if (!query) return json({ error: 'query is required' }, 400);

  const copy = T[lang === 'hi' ? 'hi' : 'en'];
  const route = classify(query);

  try {
    const [schemes, corridors] = await Promise.all([
      base44.asServiceRole.entities.Scheme.list(),
      base44.asServiceRole.entities.Corridor.list(),
    ]);

    const corridor = (corridors || []).find((row) => row.id === body.corridor_id) || (corridors || [])[0] || null;
    const city = corridor?.destination_city || '';

    if (route === 'emergency') {
      return json({
        route,
        answer: copy.emergency,
        followups: [],
        provider: 'rules-only',
        latency_ms: Date.now() - started,
        fell_back: false,
      });
    }

    if (route === 'out_of_scope') {
      return json({
        route,
        answer: copy.offTopic,
        followups: copy.followups,
        provider: 'rules-only',
        latency_ms: Date.now() - started,
        fell_back: false,
      });
    }

    const ranked = (schemes || [])
      .slice()
      .sort((a, b) => scoreScheme(b, query) - scoreScheme(a, query))
      .slice(0, 6);

    const names = ranked
      .slice(0, 3)
      .map((scheme) => scheme.name_en)
      .join(', ');

    const facts = ranked.map(factsFor).join('\n\n');

    const template = route === 'rights' ? copy.rights(city) : copy.planning(city, names);

    const systemPrompt = [
      'You are Sangi AI, a calm assistant for inter-state migrant workers in India.',
      `Answer in ${lang === 'hi' ? 'Hindi' : 'English'}.`,
      'Use ONLY the SCHEME FACTS given. Do not add facts.',
      'Never say or imply the worker is eligible, approved, guaranteed or entitled to money.',
      'Never mention phone numbers, websites, dates, rupee amounts, or any rule not in the facts.',
      'Write at most 80 words, Class 5 reading level, short plain sentences.',
      'If the facts do not answer the question, say you do not know and point to the District Labour Office.',
    ].join(' ');

    const userPrompt = `Question: ${query}\nCity: ${city || 'unknown'}\nProfile (may be incomplete): ${JSON.stringify(profile)}\n\nSCHEME FACTS:\n${facts}`;

    let answer = null;
    let provider = 'sarvam-105b';
    let fellBack = false;
    let chatError = null;

    const apiKey = (() => {
      try {
        return secrets.get('SARVAM_API_KEY');
      } catch {
        return null;
      }
    })();

    if (apiKey) {
      // Only a clean Sarvam chat model id is honoured; a pasted/corrupted
      // secret must never break the primary path.
      const storedModel = String(secrets.get('SARVAM_CHAT_MODEL') || '').trim();
      // sarvam-105b burns its whole budget on hidden reasoning and returns an
      // empty message, so the conversational variant is the reliable default.
      const model = /^sarvam-105b-conversations$/i.test(storedModel) ? storedModel : 'sarvam-105b-conversations';
      const callSarvam = async () =>
        fetch(`${BASE}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'api-subscription-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            // sarvam-105b spends part of the budget on hidden reasoning before
            // it writes the answer, so a small cap returns an empty message.
            max_tokens: 700,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: AbortSignal.timeout(18000),
        });

      try {
        let response = await callSarvam();
        if (!response.ok && (response.status === 429 || response.status >= 500)) {
          await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));
          response = await callSarvam();
        }
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const text = data?.choices?.[0]?.message?.content?.trim() || null;
          if (text && text.length < 900 && !looksUnsafe(text)) answer = text;
          else chatError = `unusable len=${text ? text.length : 0} shape=${JSON.stringify(data?.choices?.[0] || data || {}).slice(0, 260)}`;
        } else {
          const err = await response.json().catch(() => ({}));
          chatError = `${response.status} ${err?.error?.message || err?.detail || err?.message || ''}`.trim();
        }
      } catch (error) {
        answer = null;
        chatError = String(error?.message || error);
      }

      if (!answer) {
        fellBack = true;
        provider = 'base44-fallback';
        try {
          const text = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `${systemPrompt}\n\n${userPrompt}`,
          });
          const clean = typeof text === 'string' ? text.trim() : '';
          if (clean && clean.length < 900 && !looksUnsafe(clean)) answer = clean;
        } catch {
          answer = null;
        }
      }
    } else {
      fellBack = true;
      provider = 'rules-only';
    }

    if (!answer) {
      answer = template;
      provider = apiKey ? provider : 'rules-only';
    }

    return json({
      route,
      answer,
      followups: copy.followups,
      provider,
      language: lang,
      scheme_ids: ranked.map((scheme) => scheme.scheme_id),
      latency_ms: Date.now() - started,
      fell_back: fellBack,
      chat_error: chatError,
    });
  } catch (error) {
    // Never log the worker's text — only the failure shape.
    return json(
      {
        error: 'answer_failed',
        answer: T[lang === 'hi' ? 'hi' : 'en'].unknown,
        followups: T[lang === 'hi' ? 'hi' : 'en'].followups,
        provider: 'rules-only',
        latency_ms: Date.now() - started,
        fell_back: true,
      },
      200
    );
  }
}