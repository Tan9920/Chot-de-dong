import { demoProgram, demoQuestions, demoResources, demoRubrics, demoTopic } from './demo-data';
import { buildCurriculumImportReviewBoard } from './curriculum-data-pipeline';
import { getStarterCurriculumStats, getStarterTopicTitles } from './starter-curriculum-catalog';
import { buildSubjectDataCatalog, buildSubjectDataCoverageItems, buildSubjectDataGate, buildSubjectDataSummary, listSubjectDataRecords } from './subject-data-truth';

function normalise(value: any) {
  return String(value || '').trim().toLowerCase();
}

export const contentRepository = {
  async getCurriculumCatalog(_user?: any) {
    return buildSubjectDataCatalog();
  },
  async getCurriculumSummary(_user?: any) {
    const coverage = buildSubjectDataCoverageItems();
    const subjectTruth = buildSubjectDataSummary();
    return {
      levels: ['Tiểu học', 'THCS', 'THPT'],
      gradeLevelMap: Object.fromEntries(listSubjectDataRecords().map((item: any) => [item.grade, item.level])),
      grades: subjectTruth.gradeCount,
      subjects: subjectTruth.subjectCount,
      books: new Set(coverage.map((item: any) => item.book)).size,
      topics: coverage.reduce((sum: number, item: any) => sum + Number(item.topics || 0), 0),
      coverage,
      packs: coverage.filter((item: any) => item.topics > 0 || item.resources > 0).map((item: any) => ({
        id: `subject-${item.grade}-${item.subject}-${item.book}`,
        grade: item.grade,
        subject: item.subject,
        book: item.book,
        releaseTier: item.releaseTier,
        supportLevel: item.supportLevel,
        sourceStatus: item.sourceStatus,
        contentDepthAllowed: item.contentDepthAllowed
      })),
      sourceStatusSummary: subjectTruth.byStatus,
      supportSummary: subjectTruth.bySupport,
      subjectDataTruth: subjectTruth,
      starterCatalog: getStarterCurriculumStats()
    };
  },
  async overview(_user?: any) {
    const summary = buildSubjectDataSummary();
    return {
      sourceMode: 'subject_data_truth_registry_json',
      topics: buildSubjectDataCoverageItems().reduce((sum: number, item: any) => sum + Number(item.topics || 0), 0),
      programs: buildSubjectDataCoverageItems().reduce((sum: number, item: any) => sum + Number(item.programUnits || 0), 0),
      resources: buildSubjectDataCoverageItems().reduce((sum: number, item: any) => sum + Number(item.resources || 0), 0),
      questions: buildSubjectDataCoverageItems().reduce((sum: number, item: any) => sum + Number(item.questions || 0), 0),
      rubrics: buildSubjectDataCoverageItems().reduce((sum: number, item: any) => sum + Number(item.rubrics || 0), 0),
      grades: [...new Set(listSubjectDataRecords().map((item: any) => item.grade))],
      subjects: [...new Set(listSubjectDataRecords().map((item: any) => item.subject))],
      books: [...new Set(listSubjectDataRecords().map((item: any) => item.book))],
      sourceStatusSummary: summary.byStatus,
      supportSummary: summary.bySupport,
      subjectDataTruth: summary,
      starterCatalog: getStarterCurriculumStats()
    };
  },
  async getTopic(_level: string, grade: string, subject: string, book: string, topicTitle: string, _user?: any) {
    const gate = buildSubjectDataGate({ grade, subject, book, topic: topicTitle });
    if (!gate.contentDepthAllowed) {
      return {
        ...demoTopic,
        grade: grade || demoTopic.grade,
        subject: subject || demoTopic.subject,
        book: book || gate.record?.book || demoTopic.book,
        title: topicTitle || 'Chủ đề do giáo viên nhập',
        outcomes: [],
        coreCompetencies: [],
        subjectCompetencies: [],
        qualities: [],
        materials: [],
        devices: [],
        sourceMeta: {
          packId: gate.record?.id || 'subject-data-missing',
          status: gate.sourceStatus,
          sourceLabel: 'Dữ liệu môn học chưa đủ ngưỡng — chỉ dựng khung an toàn',
          note: gate.dataWarnings.join(' '),
          references: []
        }
      };
    }
    return { ...demoTopic, grade: grade || demoTopic.grade, subject: subject || demoTopic.subject, book: book || demoTopic.book, title: topicTitle || demoTopic.title };
  },
  async listRelatedTopics(grade?: any, subject?: any, _book?: any, _topic?: any, _user?: any) {
    const starterTopics = getStarterTopicTitles({ grade, subject });
    return starterTopics.length ? starterTopics : ['Chủ đề do giáo viên nhập'];
  },
  async getProgramDistribution(..._args: any[]) { return demoProgram; },
  async getQuestionBank(..._args: any[]) { return demoQuestions; },
  async getRubricBank(..._args: any[]) { return demoRubrics; },
  async filterSharedResources(..._args: any[]) { return demoResources; },
  async searchCurriculum(query: any = {}, grade?: string, subject?: string, book?: string, _user?: any) {
    const q = normalise(typeof query === 'string' ? query : query?.q);
    const selectedGrade = grade || (typeof query === 'object' ? query?.grade : undefined);
    const selectedSubject = subject || (typeof query === 'object' ? query?.subject : undefined);
    const selectedBook = book || (typeof query === 'object' ? query?.book : undefined);
    return listSubjectDataRecords()
      .filter((item: any) => !selectedGrade || item.grade === selectedGrade)
      .filter((item: any) => !selectedSubject || normalise(item.subject) === normalise(selectedSubject))
      .filter((item: any) => !selectedBook || normalise(item.book) === normalise(selectedBook))
      .filter((item: any) => {
        if (!q) return true;
        const starterTopics = getStarterTopicTitles({ grade: item.grade, subject: item.subject }).join(' ');
        return normalise(`${item.grade} ${item.subject} ${item.book} ${item.sourceStatus} ${item.supportLevel} ${starterTopics}`).includes(q);
      })
      .slice(0, 30)
      .map((item: any) => ({
        id: item.id,
        title: `Lớp ${item.grade} — ${item.subject}`,
        grade: item.grade,
        subject: item.subject,
        book: item.book,
        sourceStatus: item.sourceStatus,
        supportLevel: item.supportLevel,
        contentDepthAllowed: item.contentDepthAllowed,
        starterTopics: getStarterTopicTitles({ grade: item.grade, subject: item.subject }).slice(0, 5),
        snippet: item.contentDepthAllowed
          ? 'Có thể dùng dữ liệu có kiểm soát theo chính sách.'
          : 'Có starter topics để chọn khi test, nhưng chưa đủ dữ liệu reviewed/foundation; chỉ nên dựng khung giáo án an toàn.'
      }));
  },
  async importSeedContent(..._args: any[]) { return { ok: true, mode: 'subject_data_import_review_preview_only', imported: 0, reviewBoard: buildCurriculumImportReviewBoard(), note: 'Batch92 đã có starter topic catalog phục vụ chọn dữ liệu khi test; import review vẫn không tự nâng seed/scaffold thành verified.' }; }
};
