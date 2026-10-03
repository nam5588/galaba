import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FD1_LANGS, getFd1Guides } from "./guides.js";

const TASK_TYPES = ["ARC_REGISTER", "ARC_EXTEND", "NHIS_PAY", "ADDRESS_CHANGE"] as const;

describe("FD1 안내 (다국어)", () => {
  for (const lang of FD1_LANGS) {
    it(`${lang}: 모든 작업에 제목·설명·체크리스트·링크가 있다`, () => {
      const res = getFd1Guides(lang);
      assert.ok(res.disclaimer.length > 0);
      for (const type of TASK_TYPES) {
        const guide = res.guides[type];
        assert.ok(guide.title && guide.summary, `${lang}/${type}`);
        assert.ok(guide.checklist.length > 0 && guide.checklist.every((c) => c.text.trim()), `${lang}/${type}`);
        assert.ok(guide.links.length > 0, `${lang}/${type}`);
      }
    });
  }

  it("체크리스트 id는 언어와 상관없이 같다 (프론트 체크 상태 유지용)", () => {
    const ids = (lang: (typeof FD1_LANGS)[number]) =>
      TASK_TYPES.map((t) => getFd1Guides(lang).guides[t].checklist.map((c) => c.id).join(","));
    assert.deepEqual(ids("en"), ids("ko"));
    assert.deepEqual(ids("uz"), ids("ko"));
    assert.deepEqual(ids("ru"), ids("ko"));
  });

  it("ru: 러시아어 공식 용어로 안내한다", () => {
    const res = getFd1Guides("ru");
    assert.equal(res.lang, "ru");
    assert.equal(res.guides.ARC_REGISTER.title, "Регистрация иностранца (ARC)");
    assert.equal(res.guides.ARC_EXTEND.title, "Продление срока пребывания");
    assert.ok(res.disclaimer.includes("1345"));
  });
});
