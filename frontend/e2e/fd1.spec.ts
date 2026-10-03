import { expect, test, type Page } from '@playwright/test'

// PRD FD1 데모: 날짜를 넣으면 카드가 생기고, 완료하면 다음 주기가 만들어지고, 우즈벡어 알림이 온다.
// 날짜는 ?today= 로 고정해서 언제 돌려도 같은 결과가 나오게 한다.
const TODAY = '2026-10-03'

/** 제목이 정확히 title인 작업 카드 (체크리스트의 "외국인등록증" 같은 글자와 헷갈리지 않게) */
const card = (page: Page, title: string) =>
  page.locator('article').filter({ has: page.getByText(title, { exact: true }) })

async function enterProfile(page: Page, { entryDate }: { entryDate: string }) {
  await page.getByRole('button', { name: '정보 수정' }).click()
  await page.getByLabel('입국일').fill(entryDate)
  const hasArc = page.getByLabel('외국인등록증이 있어요')
  if (await hasArc.isChecked()) await hasArc.uncheck()
  await page.getByRole('button', { name: '저장' }).click()
}

test('데모 사용자: 비자 카드와 데모 날짜 배너', async ({ page }) => {
  await page.goto(`/visa?today=${TODAY}`)
  await expect(page.getByText(`데모 날짜: ${TODAY} 기준으로 계산 중`)).toBeVisible()
  const extend = card(page, '체류기간 연장')
  await expect(extend).toContainText('D-43')
  await expect(extend).toContainText('직전 학기 성적증명서')
})

test('신입생: 등록 마감 → 완료 → 연장·건강보험 일정 생성 (PRD 흐름 7)', async ({ page }) => {
  await page.goto(`/visa?today=${TODAY}`)
  await enterProfile(page, { entryDate: '2026-09-01' })

  const register = card(page, '외국인등록')
  await expect(register).toContainText('D-58') // 2026-09-01 + 90일 = 11-30
  await register.getByRole('button', { name: '완료했어요' }).click()
  await register.getByLabel('외국인등록일').fill('2026-10-02')
  await register.getByLabel('체류만료일').fill('2027-08-31')
  await register.getByRole('button', { name: '저장' }).click()

  await expect(card(page, '외국인등록')).toHaveCount(0)
  await expect(card(page, '체류기간 연장')).toContainText('D-332')

  await page.goto('/insurance')
  await expect(page.getByText('가입 1개월째')).toBeVisible()
})

test('연장 완료 → 새 만료일로 다음 연장 일정', async ({ page }) => {
  await page.goto(`/visa?today=${TODAY}`)
  const extend = card(page, '체류기간 연장')
  await extend.getByRole('button', { name: '완료했어요' }).click()
  await extend.getByLabel('새 체류만료일').fill('2028-02-28')
  await extend.getByRole('button', { name: '저장' }).click()
  await expect(card(page, '체류기간 연장')).toContainText('D-513')
})

test('이사했어요 → 14일 체류지 변경 마감 (FD1-6)', async ({ page }) => {
  await page.goto(`/visa?today=${TODAY}`)
  await page.getByRole('button', { name: '이사했어요' }).click()
  await expect(card(page, '체류지 변경 신고')).toContainText('D-14')
})

test('건강보험: 납부 체크 → 다음 납부일이 넘어간다 (FD1-3·4)', async ({ page }) => {
  await page.goto(`/insurance?today=${TODAY}`)
  await expect(page.getByText('가입 32개월째')).toBeVisible()
  const next = page.locator('div', { hasText: /^다음 납부/ }).last()
  await expect(next).toContainText('10.25')
  await card(page, '건강보험료 납부').getByRole('button', { name: '납부했어요' }).click()
  await expect(next).toContainText('11.25')
})

test('우즈벡어: 알림 벨에 연장 알림 (PRD 데모 장면)', async ({ page }) => {
  await page.goto(`/visa?today=2026-10-16`)
  await page.getByRole('combobox', { name: 'Language' }).selectOption('uz')
  await page.getByRole('button', { name: /Bildirishnomalar/ }).click()
  const menu = page.getByRole('dialog', { name: 'Bildirishnomalar' })
  await expect(menu).toContainText('Yashash muddatini uzaytirish')
  await expect(menu).toContainText('Muddat tugashiga 30 kun qoldi (15-noyabr)')
})
