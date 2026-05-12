import type { SessionUser } from './types';

export const demoUser: SessionUser = {
  id: 'demo-user',
  sessionId: 'demo-session',
  name: 'Giáo viên demo',
  role: 'admin',
  schoolName: 'Trường Demo CTGDPT 1–12',
  departmentName: 'Tổ chuyên môn dùng chung',
  schoolKey: 'demo-school',
  departmentKey: 'demo-department',
  permissions: ['*']
};

export const demoSettings = {
  schoolName: 'Trường Demo CTGDPT 1–12',
  departmentName: 'Tổ chuyên môn dùng chung',
  approvalRequired: true,
  preferredTemplates: ['Mẫu phát triển phẩm chất - năng lực'],
  defaultLevel: 'Tiểu học',
  defaultGrade: '1',
  defaultSubject: 'Tiếng Việt',
  defaultBook: 'Starter 1–12 / giáo viên chọn nguồn',
  defaultTopic: 'Đọc hiểu văn bản ngắn theo chủ đề gần gũi',
  teachingPolicy: {
    minSourceStatusForDeepLesson: 'reviewed',
    minReleaseTierForDeepLesson: 'school_release_candidate',
    minSupportLevelForDeepLesson: 'foundation'
  }
};

export const teachingMethods = [
  { id: 'pp-truc-quan', name: 'Trực quan', description: 'Dùng ví dụ, hình ảnh, học liệu rõ ràng.' },
  { id: 'pp-thao-luan', name: 'Thảo luận', description: 'Tổ chức trao đổi cá nhân/cặp/nhóm.' },
  { id: 'pp-luyen-tap', name: 'Luyện tập', description: 'Củng cố qua nhiệm vụ vừa sức.' }
];

export const teachingTechniques = [
  { id: 'kt-think-pair-share', name: 'Think–Pair–Share', description: 'Suy nghĩ cá nhân, trao đổi cặp, chia sẻ trước lớp.' },
  { id: 'kt-khan-trai-ban', name: 'Khăn trải bàn', description: 'Tổng hợp ý kiến nhóm có vai trò rõ.' },
  { id: 'kt-exit-ticket', name: 'Phiếu ra cửa', description: 'Kiểm tra nhanh cuối tiết.' }
];

export const demoTopic = {
  code: 'NV6-BMD',
  level: 'THCS',
  grade: '6',
  subject: 'Ngữ văn',
  book: 'Cánh Diều',
  title: 'Bài mở đầu',
  outcomes: ['Nhận biết mục tiêu bài học và cách học môn Ngữ văn ở lớp 6.', 'Biết ghi lại điều em đã hiểu và điều cần hỏi thêm.'],
  coreCompetencies: ['Tự chủ và tự học', 'Giao tiếp và hợp tác'],
  subjectCompetencies: ['Đọc hiểu văn bản ngắn', 'Trình bày suy nghĩ bằng lời nói/viết ngắn'],
  qualities: ['Chăm chỉ', 'Trách nhiệm'],
  materials: ['Phiếu học tập ngắn', 'Bảng tiêu chí quan sát', 'Tư liệu minh họa do giáo viên kiểm tra'],
  devices: ['Máy chiếu hoặc bảng phụ', 'Giấy A4/bút dạ'],
  recommendedMethodIds: ['pp-truc-quan', 'pp-thao-luan'],
  recommendedTechniqueIds: ['kt-think-pair-share', 'kt-exit-ticket'],
  recommendedModes: ['Cá nhân', 'Cặp đôi', 'Cả lớp'],
  governance: { lifecycleStatus: 'draft' },
  sourceMeta: {
    packId: 'starter-6-ngu-van-canh-dieu',
    status: 'seed',
    sourceLabel: 'Seed demo — chưa phải dữ liệu đã duyệt chuyên môn',
    note: 'Bản demo chỉ tạo khung an toàn; giáo viên cần kiểm tra kiến thức và nguồn trước khi dùng.',
    references: []
  }
};

export const demoCoverage = [
  {
    level: 'THCS', grade: '6', subject: 'Ngữ văn', book: 'Cánh Diều', topics: 1, programUnits: 1, resources: 2, questions: 3, rubrics: 1,
    sourceStatus: 'seed', releaseTier: 'internal_preview', supportLevel: 'starter', supportFlags: ['seed_demo'], supportNotes: ['Chưa verified toàn bộ.']
  },
  {
    level: 'Tiểu học', grade: '1', subject: 'Tiếng Việt', book: 'Starter', topics: 0, programUnits: 0, resources: 0, questions: 0, rubrics: 0,
    sourceStatus: 'scaffold', releaseTier: 'internal_preview', supportLevel: 'starter', supportFlags: ['coverage_placeholder'], supportNotes: ['Chỉ có scaffold để biểu thị phạm vi 1–12.']
  },
  {
    level: 'THPT', grade: '10', subject: 'Toán', book: 'Starter', topics: 0, programUnits: 0, resources: 0, questions: 0, rubrics: 0,
    sourceStatus: 'scaffold', releaseTier: 'internal_preview', supportLevel: 'starter', supportFlags: ['coverage_placeholder'], supportNotes: ['Chỉ có scaffold để biểu thị phạm vi 1–12.']
  }
];

export const demoCurriculumCatalog = {
  level: '1–12',
  grades: {
    '6': {
      name: 'Lớp 6',
      subjects: {
        'Ngữ văn': {
          name: 'Ngữ văn',
          books: {
            'Cánh Diều': {
              name: 'Cánh Diều',
              topics: {
                'Bài mở đầu': { title: 'Bài mở đầu' }
              }
            }
          }
        }
      }
    },
    '1': { name: 'Lớp 1', subjects: { 'Tiếng Việt': { name: 'Tiếng Việt', books: { Starter: { name: 'Starter', topics: {} } } } } },
    '10': { name: 'Lớp 10', subjects: { Toán: { name: 'Toán', books: { Starter: { name: 'Starter', topics: {} } } } } }
  }
};

export const demoTemplates = [
  {
    id: 'competency-template',
    name: 'Mẫu phát triển phẩm chất - năng lực',
    description: 'Mẫu giáo án an toàn cho demo, nhấn mạnh mục tiêu, hoạt động, sản phẩm và đánh giá.',
    useCases: ['Dạy học thường ngày', 'Soạn khung bản nháp', 'Dùng cho demo nội bộ'],
    assessmentFocus: ['Minh chứng học tập', 'Câu hỏi kiểm tra nhanh', 'Phân hóa vừa sức'],
    sections: [
      { id: 'muc-tieu', title: 'Mục tiêu', objective: 'Nêu rõ kiến thức, năng lực, phẩm chất.', prompts: ['Kiến thức/kĩ năng', 'Năng lực chung', 'Năng lực đặc thù', 'Phẩm chất'] },
      { id: 'tien-trinh', title: 'Tiến trình', objective: 'Tổ chức các hoạt động theo quy trình rõ.', prompts: ['Khởi động', 'Hình thành kiến thức', 'Luyện tập', 'Vận dụng'] }
    ]
  }
];

export const demoProgram = {
  grade: '6', subject: 'Ngữ văn', book: 'Cánh Diều', units: [
    { week: 1, title: 'Bài mở đầu', duration: 1, note: 'Seed demo.' }
  ]
};

export const demoQuestions = [
  { id: 'q1', level: 'nhan_biet', question: 'Em hãy nêu một mục tiêu học tập của bài mở đầu.' },
  { id: 'q2', level: 'thong_hieu', question: 'Vì sao cần ghi lại điều chưa hiểu sau bài học?' },
  { id: 'q3', level: 'van_dung', question: 'Lập một kế hoạch học tập ngắn cho tuần đầu.' }
];

export const demoRubrics = [
  { id: 'r1', criteria: 'Tham gia hoạt động', levels: ['Cần hỗ trợ', 'Đạt', 'Tốt'] }
];

export const demoResources = [
  { id: 'res1', title: 'Phiếu học tập bài mở đầu', type: 'worksheet', audience: 'teacher_private', sourceStatus: 'seed' },
  { id: 'res2', title: 'Bảng kiểm quan sát hoạt động nhóm', type: 'rubric', audience: 'teacher_private', sourceStatus: 'seed' }
];

export function nowIso() { return new Date().toISOString(); }
export function okSummary() { return { total: 0, active: 0, invited: 0, inactive: 0, leaders: 0, admins: 0, byDepartment: [] }; }
