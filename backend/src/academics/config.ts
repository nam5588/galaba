// 수강 & 학업 기준 값. 학칙·국제처 기준이 바뀌면 코드 곳곳이 아니라 여기서만 바꾼다.
// 출처: docs/prd-academics.md 8장 "데이터 및 API 계약"

export const ACADEMICS_CONFIG = {
  /** 졸업 필요 학점 (demo-user.json에 값이 있으면 그 값을 우선 사용) */
  defaultGraduationCredits: 130,
  /** GPA 만점 (국민대 4.5 기준) */
  gpaScale: 4.5,
  /** 이 값 미만이면 danger (학사경고 구간, 참고용) */
  gpaWarningBelow: 2.0,
  /** 경고선에 이만큼 근접하면 warning */
  gpaWarningMargin: 0.3,
  disclaimer: "학점·성적 수치는 참고용입니다. 졸업·비자 관련 최종 확인은 학교 포털과 국제처에서 하세요.",
  sources: [
    { label: "국민대학교 국제교류처", url: "https://cms.kookmin.ac.kr/oia/index.do" },
    { label: "국민대학교 학사정보", url: "https://www.kookmin.ac.kr/" },
  ],
} as const;
