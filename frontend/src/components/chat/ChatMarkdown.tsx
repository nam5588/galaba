import type { ReactNode } from 'react'
import styles from './chat.module.css'

/**
 * 답변용 아주 작은 마크다운 렌더러.
 * 지원: 문단(빈 줄로 구분), 줄바꿈, "- " / "* " / "• " 글머리표, "1. " 번호 목록, "#" 소제목, **굵게**, `코드`, [링크](https://…), 맨 URL.
 * HTML은 해석하지 않는다(React가 텍스트를 이스케이프하므로 안전).
 */

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul' | 'ol'; items: string[]; nums: number[] }
  | { kind: 'h'; text: string }

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] | null = null
  let listBlock: { kind: 'ul' | 'ol'; items: string[]; nums: number[] } | null = null

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim()

    if (!line || /^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      paragraph = null
      listBlock = null
      continue
    }

    const heading = /^#{1,6}\s+(.+)$/.exec(line)
    if (heading) {
      blocks.push({ kind: 'h', text: heading[1] })
      paragraph = null
      listBlock = null
      continue
    }

    const bullet = /^[-*•·]\s+(.+)$/.exec(line)
    // 번호는 모델이 쓴 숫자를 그대로 쓴다(빈 줄·하위 글머리표로 목록이 끊겨도 1부터 다시 세지 않게). "2026. 10. 31." 같은 날짜는 제외
    const ordered = bullet ? null : /^(\d{1,2})[.)]\s+(.+)$/.exec(line)
    if (bullet || ordered) {
      const kind = bullet ? 'ul' : 'ol'
      if (!listBlock || listBlock.kind !== kind) {
        listBlock = { kind, items: [], nums: [] }
        blocks.push(listBlock)
      }
      listBlock.items.push(bullet?.[1] ?? ordered?.[2] ?? '')
      listBlock.nums.push(ordered ? Number(ordered[1]) : 0)
      paragraph = null
      continue
    }

    // 들여쓴 줄은 바로 앞 목록 항목의 이어지는 내용으로 본다
    if (listBlock && /^\s{2,}/.test(rawLine)) {
      listBlock.items[listBlock.items.length - 1] += `\n${line}`
      continue
    }

    listBlock = null
    if (!paragraph) {
      paragraph = []
      blocks.push({ kind: 'p', lines: paragraph })
    }
    paragraph.push(line)
  }

  return blocks
}

/**
 * **굵게** · `코드` · [제목](https://…) · 맨 URL(https://…).
 * 링크는 http(s)만 만들고 새 탭으로 연다. 맨 URL 끝의 문장부호·닫는 괄호는 링크에서 뺀다.
 * 한글이 나오면 URL이 끝난 것으로 본다("https://www.hikorea.go.kr에서"의 "에서"가 링크에 붙지 않게).
 */
const INLINE =
  /\*\*([^*\n]+?)\*\*|`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()[\]ᄀ-ᇿ㄰-㆏가-힯]*[^\s<>()[\].,;:!?'"’”」』ᄀ-ᇿ㄰-㆏가-힯])/g

function ExternalAnchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

function renderInline(text: string, keyPrefix = ''): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    const key = `${keyPrefix}${at}`
    const [, bold, code, linkText, linkUrl, bareUrl] = m
    if (bold !== undefined) out.push(<strong key={key}>{renderInline(bold, `${key}-`)}</strong>)
    else if (code !== undefined) out.push(<code key={key}>{code}</code>)
    else if (linkUrl !== undefined) out.push(<ExternalAnchor key={key} href={linkUrl}>{linkText}</ExternalAnchor>)
    else if (bareUrl !== undefined) out.push(<ExternalAnchor key={key} href={bareUrl}>{bareUrl}</ExternalAnchor>)
    last = at + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function renderLines(lines: string[]): ReactNode[] {
  return lines.flatMap((line, i) => (i === 0 ? renderInline(line, 'l0-') : [<br key={`br-${i}`} />, ...renderInline(line, `l${i}-`)]))
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  return (
    <div className={styles.markdown}>
      {blocks.map((block, i) => {
        if (block.kind === 'h') return <p key={i} className={styles.mdHeading}>{renderInline(block.text)}</p>
        if (block.kind === 'p') return <p key={i}>{renderLines(block.lines)}</p>
        const items = block.items.map((item, j) => (
          <li key={j} data-n={block.kind === 'ol' ? block.nums[j] : undefined}>
            {renderLines(item.split('\n'))}
          </li>
        ))
        return block.kind === 'ul' ? <ul key={i}>{items}</ul> : <ol key={i}>{items}</ol>
      })}
    </div>
  )
}
