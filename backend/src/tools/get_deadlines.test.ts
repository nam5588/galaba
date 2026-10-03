import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoProfile, getDeadlinesTool } from "./get_deadlines.js";

describe("get_deadlines (FD1 채팅 도구)", () => {
  it("데모 사용자 프로필: visa.expires를 만료일로, paidThrough까지 납부", () => {
    const p = demoProfile();
    assert.equal(p.visaType, "D-2");
    assert.equal(p.stayExpiryDate, "2026-11-15");
    assert.equal(p.paidMonths?.[0], "2024-03");
    assert.equal(p.paidMonths?.at(-1), "2026-09");
  });

  it("예시와 같은 형식으로 날짜순 기한을 돌려준다", async () => {
    const items = await getDeadlinesTool.run({});
    assert.ok(Array.isArray(items) && items.length > 0);
    for (const d of items as Exclude<typeof items, { error: string }>) {
      assert.ok(d.title && d.todo && d.url.startsWith("https://"));
      assert.match(d.dueDate, /^\d{4}-\d{2}-\d{2}$/);
    }
    const dates = (items as { dueDate: string }[]).map((d) => d.dueDate);
    assert.deepEqual(dates, [...dates].sort());
    assert.ok((items as { type: string }[]).some((d) => d.type === "visa"));
  });

  it("withinDays: 그 안의 기한만", async () => {
    const all = (await getDeadlinesTool.run({})) as { dDay: number }[];
    const soon = (await getDeadlinesTool.run({ withinDays: 0 })) as { dDay: number }[];
    assert.ok(soon.every((d) => d.dDay <= 0));
    assert.ok(soon.length <= all.length);
  });
});
