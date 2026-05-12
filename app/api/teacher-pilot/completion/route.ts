import { NextRequest, NextResponse } from 'next/server';
import {
  buildTeacherPilotCompletionBoard,
  buildTeacherPilotSafeLessonFrame,
  buildTeacherPilotPrintableExport,
  listTeacherPilotSubjects,
  listTeacherPilotTopics,
  validateTeacherPilotTopicInput
} from '@/lib/teacher-pilot-completion';
import { buildCurriculumGapBoard, listCurriculumBooksets, listCurriculumRecords, resolveCurriculumSelection } from '@/lib/curriculum-compatibility-matrix';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const grade = url.searchParams.get('grade') || '5';
  const subject = url.searchParams.get('subject') || 'Tiếng Việt';
  const topicId = url.searchParams.get('topicId') || '';
  const bookset = url.searchParams.get('bookset') || 'ket_noi_tri_thuc';
  return NextResponse.json({
    board: buildTeacherPilotCompletionBoard(),
    subjects: listTeacherPilotSubjects(grade),
    topics: listTeacherPilotTopics(grade, subject),
    booksets: listCurriculumBooksets(),
    curriculumRecords: listCurriculumRecords({ grade, subject, bookset }),
    curriculumResolution: resolveCurriculumSelection({ grade, subject, topicId, bookset }),
    curriculumGapBoard: buildCurriculumGapBoard(),
    printableExport: buildTeacherPilotPrintableExport({ grade, subject, topicId, bookset }),
    warning: 'Batch110 giữ Batch108/109 guard và bổ sung ma trận chương trình, primary bookset, legacy hidden, safer composer: không bắt tự gõ, không cho Tiếng Việt + Phân số, không cho tự chọn verified. Hosted runtime vẫn chưa được claim pass.'
  });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try { body = await request.json(); } catch { body = {}; }
  return NextResponse.json({
    mode: 'safe_frame_only_no_ai_no_deep_content_topic_picker_guarded',
    topicValidation: validateTeacherPilotTopicInput(body),
    frame: buildTeacherPilotSafeLessonFrame(body),
    printableExport: buildTeacherPilotPrintableExport(body),
    curriculumResolution: resolveCurriculumSelection(body),
    curriculumGapBoard: buildCurriculumGapBoard(),
    board: buildTeacherPilotCompletionBoard({ lesson: body }),
    warning: 'POST chỉ dựng khung giáo án an toàn theo ma trận lớp–môn–bộ sách–bài/chủ đề và gói xuất offline/printable source-level. Nhãn dữ liệu do backend/ma trận tự tính; không cho người dùng tự chọn verified; không sinh kiến thức sâu, không tạo đáp án, không dùng AI.'
  });
}
