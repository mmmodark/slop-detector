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

  if (!process.env.ACCESS_CODE) {
    return res.status(500).json({ error: '설정 누락: ACCESS_CODE가 없습니다.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: '설정 누락: ANTHROPIC_API_KEY가 없습니다.' });
  }
  if (!passcode || passcode !== process.env.ACCESS_CODE) {
    return res.status(401).json({ error: '비밀코드가 올바르지 않습니다.' });
  }
  if (!prompt || prompt.length < 10) {
    return res.status(400).json({ error: '진단할 내용이 비어 있습니다.' });
  }

  try {
    // 프롬프트(지시사항)와 글(원문)을 분리해서 Claude에게 보냄
    // article이 있으면 system+user 분리, 없으면 기존 방식(ping 등)
    const messages = article
      ? [{ role: 'user', content: prompt + '\n\n글:\n"""\n' + article + '\n"""' }]
      : [{ role: 'user', content: prompt }];

    // article을 system prompt로 넣지 않고,
    // 대신 JSON.stringify로 직렬화해서 Claude에게 안전하게 전달
    const claudeBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: article
        ? [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'text', text: '진단할 글 (원문 그대로):' },
                { type: 'text', text: article }
              ]
            }
          ]
        : [{ role: 'user', content: prompt }]
    };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': (process.env.ANTHROPIC_API_KEY || '').trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeBody)
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
