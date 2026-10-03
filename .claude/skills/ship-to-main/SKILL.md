---
name: ship-to-main
description: galaba 변경사항을 검증하고 커밋해서 main에 바로 push한다(팀 규칙: PR 없이 main 직접 push). "올려줘", "푸시해줘", "깃에 반영해줘", "main에 때려줘" 같은 요청에 사용.
---

# main에 올리기

팀 규칙: **PR 없이 main에 직접 push한다.** 리뷰 단계가 없으니 push 전 검증이 유일한 안전장치다.
순서가 중요하다: **검증 → 커밋 → 최신 main 받기 → 다시 검증 → push.** (커밋 전에 `git pull --rebase`를 하면 "unstaged changes" 에러로 실패한다.)

## 절차

1. **변경 내용 확인**: `git status`와 `git diff --stat`으로 무엇이 올라가는지 사용자에게 한 줄로 요약한다. 의도하지 않은 파일(개인 메모, `.env`, 빌드 결과물, `node_modules`)이 있으면 빼거나 `.gitignore`에 추가한다.
2. **검증**: 의존성이 바뀌었으면 `npm run install:all`을 먼저 한다.
   ```bash
   npm run check                        # 백엔드 + 프론트 타입체크
   npm --prefix frontend run lint       # error 0개 (warning은 허용)
   npm run build                        # 변경이 클 때
   ```
3. **커밋**: 파일을 명시해서 add 한다(`git add -A` 대신). 메시지는 `종류: 무엇을` 형식으로 쓴다.
   - `feat:` 새 기능 / `fix:` 버그 수정 / `chore:` 설정·의존성 / `docs:` 문서
   - 예: `feat: v0 메인 대시보드 화면 추가`
   - 이번에 올리지 않을 변경이 남아 있으면 `git stash`로 치운다(push 훅은 작업 트리가 깨끗해야 통과한다).
4. **최신 main 받기**: 다른 팀원이 먼저 push했을 수 있다.
   ```bash
   git pull --rebase origin main
   ```
   충돌이 나면 멈추고 어느 파일의 어떤 부분이 겹쳤는지 사용자에게 설명한다. 다른 사람 코드를 임의로 지우지 않는다.
   - 해결: 파일을 고치고 → `git add <파일>` → `git rebase --continue`
   - 되돌리기: `git rebase --abort` (pull 전 상태로 돌아간다)
5. **다시 검증**: pull로 새 커밋이 들어왔으면 `npm run check`를 다시 돌린다. 팀원이 `package.json`을 바꿨다면 `npm run install:all`부터.
6. **push**
   ```bash
   git push origin main
   ```
   - `rejected ... (fetch first)`가 나오면 그 사이 누가 push한 것이다. 4단계부터 다시 한다.
   - `.claude/hooks/guard-git.mjs` 훅이 force push, `.env` 커밋, 커밋 안 된 변경, 타입체크 실패를 막는다. 막히면 훅 메시지대로 고치고, 훅을 우회하지 않는다.
7. **확인**: `git log origin/main --oneline -3`로 올라간 것을 확인하고, 커밋 링크(`https://github.com/nam5588/galaba/commit/<sha>`)를 사용자에게 알려준다.

## 하지 말 것
- `git push --force`, `git reset --hard origin/main` (다른 팀원 커밋이 사라진다)
- 실패한 검증을 무시하고 push
- `develop` 브랜치에 push (현재 팀은 main만 쓴다)
