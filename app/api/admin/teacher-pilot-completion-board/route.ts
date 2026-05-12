import { NextResponse } from 'next/server';
import { buildTeacherPilotCompletionBoard, buildTeacherPilotPrintableExport, readTeacherPilotTopicCatalog } from '@/lib/teacher-pilot-completion';
import { buildCurriculumGapBoard, readCurriculumCompatibilityMatrix } from '@/lib/curriculum-compatibility-matrix';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildTeacherPilotCompletionBoard(),
    topicCatalog: readTeacherPilotTopicCatalog(),
    curriculumMatrix: readCurriculumCompatibilityMatrix(),
    curriculumGapBoard: buildCurriculumGapBoard(),
    printableExport: buildTeacherPilotPrintableExport({ grade: '5', subject: 'Toán', topicId: 'g5-toan-phan-so', bookset: 'ket_noi_tri_thuc' }),
    adminWarning: 'Batch110 board kiểm tra ma trận lớp–môn–bộ sách–bài/chủ đề, legacy/reference-only, gói xuất offline/printable và nhãn dữ liệu tự động; không thay thế hosted runtime smoke.'
  });
}

// Batch108 board compatibility marker: Batch108 board.
