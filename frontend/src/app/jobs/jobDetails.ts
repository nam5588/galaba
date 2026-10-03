export type EmployerPost = {
  isDemo: boolean
  address: string
  latitude: number
  longitude: number
  images: { src: string; alt: string }[]
  duties: string[]
  qualifications: string[]
  benefits: string[]
  hiringProcess: string
  contact: string
}

// 실제 주소·사진·사업주 원문이 들어오면 공고 ID별로 교체하세요.
// 좌표는 국민대학교 주변 지도 시연용이며 실제 사업장 위치가 아닙니다.
export const employerPosts: Record<number, EmployerPost> = {
  1: {
    isDemo: true, address: '국민대학교 주변 · 시연용 위치', latitude: 37.6094, longitude: 126.9985,
    images: [{ src: '/images/jobs/cafe-interior.webp', alt: '카페 내부' }],
    duties: ['주문 접수 및 고객 응대', '음료 제조 보조와 재료 준비', '마감 정리 및 매장 위생 관리'],
    qualifications: ['공고의 근무 일정에 참여할 수 있는 분', '한국어로 기본 주문을 안내할 수 있는 분', '경력 없이도 업무를 차근차근 배우고 싶은 분'],
    benefits: ['업무 교육 제공', '시험 기간 근무 일정 협의', '근무 중 음료 제공'],
    hiringProcess: '지원 → 일정 협의 → 면접 → 근무조건 확인', contact: '담당자 연락처 등록 예정',
  },
  2: {
    isDemo: true, address: '국민대학교 주변 · 시연용 위치', latitude: 37.6088, longitude: 126.9996,
    images: [{ src: '/images/jobs/mart-interior.webp', alt: '편의점 내부' }],
    duties: ['계산 및 고객 응대', '상품 진열과 유통기한 확인', '재고 정리 및 매장 청소'],
    qualifications: ['주말 고정 근무가 가능한 분', '기본 한국어 응대가 가능한 분'],
    benefits: ['계산대 업무 교육', '업무 매뉴얼 제공'],
    hiringProcess: '지원 → 면접 → 일정 조율', contact: '담당자 연락처 등록 예정',
  },
  3: {
    isDemo: true, address: '국민대학교 주변 · 시연용 위치', latitude: 37.6080, longitude: 127.0008,
    images: [{ src: '/images/jobs/restaurant-interior.webp', alt: '음식점 내부' }],
    duties: ['손님 안내 및 주문 확인', '음식 서빙', '테이블 정리 및 마감 보조'],
    qualifications: ['주문 내용을 한국어로 확인할 수 있는 분', '화·목 근무 일정 협의가 가능한 분'],
    benefits: ['메뉴 및 응대 교육', '근무일 식사 제공'],
    hiringProcess: '지원 → 근무시간 확인 → 면접', contact: '담당자 연락처 등록 예정',
  },
  4: {
    isDemo: true, address: '국민대학교 주변 · 시연용 위치', latitude: 37.6074, longitude: 126.9978,
    images: [{ src: '/images/jobs/study-interior.webp', alt: '스터디카페 내부' }],
    duties: ['좌석 이용 안내', '공용 공간 정리', '비품 점검과 마감 관리'],
    qualifications: ['금요일 저녁 근무가 가능한 분', '조용한 공간에서 꼼꼼하게 일할 수 있는 분'],
    benefits: ['시설 관리 교육', '업무 체크리스트 제공'],
    hiringProcess: '지원 → 면접 → 일정 조율', contact: '담당자 연락처 등록 예정',
  },
  5: {
    isDemo: true, address: '국민대학교 주변 · 시연용 위치', latitude: 37.6100, longitude: 127.0010,
    images: [{ src: '/images/jobs/deli-interior.webp', alt: '델리 내부' }],
    duties: ['홀 서비스', '주문 안내', '매장 정리'],
    qualifications: ['공고에 표시된 업종·체류·근무시간 조건을 확인할 수 있는 분'],
    benefits: ['업무 안내 제공'],
    hiringProcess: '근무 가능 조건 확인 → 지원 → 면접', contact: '담당자 연락처 등록 예정',
  },
}
