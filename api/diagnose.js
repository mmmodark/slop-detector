export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return res.status(400).json({ error: '요청을 읽지 못했어요.', detail: String(e) });
    }
  }

  const { passcode, prompt, article } = body || {};

  if (!process.env.ACCESS_CODE) return res.status(500).json({ error: 'ACCESS_CODE 없음' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 없음' });
  if (!passcode || passcode !== process.env.ACCESS_CODE) return res.status(401).json({ error: '비밀코드가 올바르지 않습니다.' });
  if (!prompt || prompt.length < 10) return res.status(400).json({ error: '진단할 내용이 비어 있습니다.' });

  try {
    const fullPrompt = article
      ? prompt + '\n\n진단할 글:\n' + article
      : prompt;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': (process.env.ANTHROPIC_API_KEY || '').trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        messages: [{ role: 'user', content: fullPrompt }]
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(200).json({ error: `Claude 거부 (HTTP ${r.status})`, detail });
    }

    const data = await r.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(200).json({ error: '서버 오류', detail: String(e) });
  }
}
