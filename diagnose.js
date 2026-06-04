// 이 파일은 사용자에게 안 보이는 '다리'예요.
// 비밀코드를 확인하고, 통과한 요청만 Claude에게 전달합니다.
// API 키와 비밀코드는 코드에 적지 않고 Vercel 환경변수에서 읽어옵니다.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  // req.body가 자동으로 안 풀리는 환경(Other 프리셋 등)을 대비해 직접 읽어요.
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

  const { passcode, prompt } = body || {};

  // 환경변수가 비어있는지 먼저 점검 (원인 빨리 드러나게)
  if (!process.env.ACCESS_CODE) {
    return res.status(500).json({ error: '설정 누락: ACCESS_CODE가 없습니다. Vercel 환경변수를 확인하세요.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: '설정 누락: ANTHROPIC_API_KEY가 없습니다. Vercel 환경변수를 확인하세요.' });
  }

  // 1단계: 비밀코드 검사
  if (!passcode || passcode !== process.env.ACCESS_CODE) {
    return res.status(401).json({ error: '비밀코드가 올바르지 않습니다.' });
  }

  // 2단계: 내용 점검
  if (!prompt || prompt.length < 10) {
    return res.status(400).json({ error: '진단할 내용이 비어 있습니다.' });
  }

  // 3단계: Claude 호출
  try {
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
        messages: [{ role: 'user', content: prompt }]
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
