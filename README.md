# 글 진단기 — 배포 안내서

이 폴더에는 두 개의 핵심 파일이 있어요.

- `index.html` — 사람들이 보는 화면 (비밀코드 입장 + 진단기)
- `api/diagnose.js` — 사용자에게 안 보이는 '다리'. 비밀코드를 확인하고 Claude를 대신 부름

비밀코드와 API 키는 코드 어디에도 안 적혀 있어요. Vercel의 '환경변수'라는 비밀 칸에 넣습니다.
그래서 이 폴더를 GitHub에 통째로 올려도 안전해요.

---

## 올리는 순서 (한 번만 하면 됨)

### 1단계 — GitHub에 올리기
포트폴리오 올렸던 방식과 똑같아요.

1. github.com 에서 새 저장소(repository)를 하나 만든다. 이름은 `slop-detector` 정도로.
2. 이 폴더(`slop-detector`)의 파일을 그 저장소에 올린다.
   - 웹에서 드래그로 올려도 되고, 평소 쓰던 git 명령으로 올려도 돼요.

### 2단계 — Vercel에 연결하기
1. vercel.com 에 GitHub 계정으로 로그인한다. (무료)
2. "Add New… → Project" 누른다.
3. 방금 만든 `slop-detector` 저장소를 고르고 "Import".
4. 설정은 건드릴 것 없이 그대로 두고, 아래 3단계(환경변수)만 먼저 넣고 Deploy.

### 3단계 — 비밀 칸(환경변수) 두 개 넣기  ★가장 중요★
Vercel의 프로젝트 → Settings → Environment Variables 에서 두 개를 추가해요.

| 이름 (Key)          | 값 (Value)                          |
|---------------------|-------------------------------------|
| `ANTHROPIC_API_KEY` | 본인 Anthropic API 키 (sk-ant-... ) |
| `ACCESS_CODE`       | 원하는 비밀코드 (예: sponge2025)    |

- 이름은 위와 **철자 그대로** 적어야 해요. (대문자, 밑줄 포함)
- 다 넣고 저장한 뒤 "Deploy"(또는 Redeploy)를 누른다.

### 4단계 — 확인
- 배포가 끝나면 Vercel이 주소를 하나 줘요 (예: `slop-detector.vercel.app`).
- 그 주소로 들어가면 비밀코드 입력 화면이 떠요.
- 3단계에서 정한 코드를 넣으면 진단기가 열려요.

---

## 비밀코드를 바꾸고 싶을 때
Vercel → Settings → Environment Variables 에서 `ACCESS_CODE` 값만 바꾸고 Redeploy.
코드를 여러 개 쓰고 싶어지면 그때 다리 코드(`api/diagnose.js`)를 조금만 고치면 돼요.

## 자주 나는 문제
- **입장이 안 됨 / 비밀코드 틀렸다고 나옴** → `ACCESS_CODE` 철자 확인, 넣고 나서 Redeploy 했는지 확인.
- **진단 눌렀는데 통신 실패** → `ANTHROPIC_API_KEY`가 정확한지, 키에 크레딧이 남았는지 확인.
- **화면은 뜨는데 진단만 안 됨** → 거의 항상 환경변수 문제예요. 위 두 개를 다시 확인.
