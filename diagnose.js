// 이 파일은 사용자에게 안 보이는 '다리'예요.
// 비밀코드를 확인하고, 통과한 요청만 Claude에게 전달합니다.
// API 키와 비밀코드는 코드에 적지 않고 Vercel 환경변수에서 읽어옵니다.

export default async function handler(req, res) {
  // POST 요청만 받음
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  const { passcode, prompt } = req.body || {};

  // 1단계: 비밀코드 검사 — 틀리면 여기서 막힘 (Claude 호출 안 함)
  if (!passcode || passcode !== process.env.ACCESS_CODE) {
    return res.status(401).json({ error: '비밀코드가 올바르지 않습니다.' });
  }

  // 2단계: 통과한 요청만 Claude에게 전달
  if (!prompt || prompt.length < 10) {
    return res.status(400).json({ error: '진단할 내용이 비어 있습니다.' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: 'Claude 응답 오류', detail });
    }

    const data = await r.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류', detail: String(e) });
  }
}
