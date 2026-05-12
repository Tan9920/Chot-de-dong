type NormalizedExportPayload = {
  lessonId?: string;
  savedLessonId?: string;
  title: string;
  level: string;
  grade: string;
  subject: string;
  book: string;
  topic: string;
  template: string;
  duration: string;
  teacherNote: string;
  methods: string[];
  techniques: string[];
  content: string;
  lessonStatus: string;
  currentVersion?: number | string;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
  exporterName?: string;
  governanceSnapshot: any;
  provenanceSnapshot?: any;
  compliancePacket?: any;
  sourceStatus: string;
  supportLevel: string;
  reviewStatus: string;
  releaseTier: string;
  storageMode?: string;
  exportedFromSavedLesson?: boolean;
  exportWatermark?: string;
};

function firstDefined(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function readSourceStatus(snapshot: any, fallback = 'seed') {
  return firstDefined(snapshot?.sourceStatus, snapshot?.sourceStatusSummary?.sourceStatus, snapshot?.dataTruth?.sourceStatus, snapshot?.truthStatus, fallback);
}

function readSupportLevel(snapshot: any, fallback = 'starter') {
  return firstDefined(snapshot?.supportLevel, snapshot?.coverage?.supportLevel, snapshot?.readiness?.supportLevel, fallback);
}

export function normalizeExportPayload(input: any = {}): NormalizedExportPayload {
  const governanceSnapshot = input.governanceSnapshot || null;
  const lessonStatus = input.lessonStatus || input.status || 'draft';
  const sourceStatus = input.sourceStatus || readSourceStatus(governanceSnapshot, 'seed');
  const supportLevel = input.supportLevel || readSupportLevel(governanceSnapshot, 'starter');
  return {
    lessonId: input.lessonId || input.savedLessonId || input.id || undefined,
    savedLessonId: input.savedLessonId || input.lessonId || input.id || undefined,
    title: input.title || 'Giáo án demo',
    level: input.level || 'THCS',
    grade: input.grade || '6',
    subject: input.subject || 'Ngữ văn',
    book: input.book || 'Cánh Diều',
    topic: input.topic || 'Bài mở đầu',
    template: input.template || 'Mẫu giáo án',
    duration: input.duration || '1 tiết',
    teacherNote: input.teacherNote || 'Giáo viên cần kiểm tra kiến thức, nguồn và bản quyền trước khi dùng chính thức.',
    methods: Array.isArray(input.methods) ? input.methods : [],
    techniques: Array.isArray(input.techniques) ? input.techniques : [],
    content: input.content || '',
    lessonStatus,
    currentVersion: input.currentVersion || input.version,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    authorName: input.authorName,
    exporterName: input.exporterName,
    governanceSnapshot,
    provenanceSnapshot: input.provenanceSnapshot || null,
    compliancePacket: input.compliancePacket || null,
    sourceStatus,
    supportLevel,
    reviewStatus: input.reviewStatus || governanceSnapshot?.reviewStatus || governanceSnapshot?.approvalStatus || (lessonStatus === 'approved' ? 'approved_lesson_status_only' : 'draft_or_unreviewed'),
    releaseTier: input.releaseTier || governanceSnapshot?.releaseTier || governanceSnapshot?.release?.tier || 'not_released',
    storageMode: input.storageMode,
    exportedFromSavedLesson: Boolean(input.exportedFromSavedLesson || input.lessonId || input.savedLessonId),
    exportWatermark: input.exportWatermark || (lessonStatus === 'approved' && ['reviewed', 'verified', 'approved_for_release'].includes(sourceStatus) ? '' : 'BẢN NHÁP / CẦN GIÁO VIÊN KIỂM TRA')
  };
}

export function buildExportFilename(payload: any, ext: string) {
  const clean = String(payload.title || 'giao-an-demo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '').toLowerCase();
  const versionSuffix = payload.currentVersion ? `-v${String(payload.currentVersion).replace(/[^0-9a-zA-Z_-]/g, '')}` : '';
  return `${clean || 'giao-an-demo'}${versionSuffix}.${ext}`;
}

function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeLines(text: string, maxLines = 260) {
  const normalized = String(text || 'Nội dung demo.').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.split('\n').slice(0, maxLines);
}

function formatList(label: string, values: string[]) {
  return `${label}: ${values.length ? values.join(', ') : 'Chưa chọn / giáo viên bổ sung'}`;
}

function complianceLines(payload: NormalizedExportPayload) {
  const packet = payload.compliancePacket || {};
  const warnings = Array.isArray(packet.warnings) ? packet.warnings : [];
  const blockers = Array.isArray(packet.blockers) ? packet.blockers : [];
  const nonClaims = Array.isArray(packet.nonClaims) ? packet.nonClaims : [];
  return [
    '',
    'PHỤ LỤC KIỂM TRA / COMPLIANCE PACKET',
    `Mã giáo án đã lưu: ${payload.lessonId || 'không có - export từ payload tạm'}`,
    `Xuất từ giáo án đã lưu: ${payload.exportedFromSavedLesson ? 'Có' : 'Không'}`,
    `Phiên bản: ${payload.currentVersion || 'chưa xác định'}`,
    `Trạng thái giáo án: ${payload.lessonStatus}`,
    `Trạng thái dữ liệu/nguồn: ${payload.sourceStatus}`,
    `Mức hỗ trợ 1–12: ${payload.supportLevel}`,
    `Trạng thái review/release: ${payload.reviewStatus} / ${payload.releaseTier}`,
    `Storage mode: ${payload.storageMode || 'chưa xác định'}`,
    `Watermark/chú thích: ${payload.exportWatermark || 'không'}`,
    `Người xuất: ${payload.exporterName || 'demo user'}`,
    `Tác giả/lưu bởi: ${payload.authorName || 'chưa xác định'}`,
    `Cập nhật lần cuối: ${payload.updatedAt || 'chưa xác định'}`,
    'Cảnh báo:',
    ...(warnings.length ? warnings.map((item: string) => `- ${item}`) : ['- Chưa có cảnh báo chi tiết; vẫn cần giáo viên kiểm tra.']),
    ...(blockers.length ? ['Blocker:', ...blockers.map((item: string) => `- ${item}`)] : []),
    'Không claim:',
    ...(nonClaims.length ? nonClaims.map((item: string) => `- ${item}`) : ['- Không tự nhận chuẩn Bộ/đúng 100%.', '- Không thay thế kiểm tra chuyên môn của giáo viên.']),
    `Ghi chú pháp lý: ${packet.legalNotice || 'Giáo viên/tổ chuyên môn cần kiểm tra kiến thức, nguồn, bản quyền học liệu và điều chỉnh theo lớp học thật trước khi dùng.'}`
  ];
}

function paragraphXml(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return '<w:p />';
  const isTitle = /^[IVX]+\.|^KẾ HOẠCH|^PHỤ LỤC|^GHI CHÚ|^Cảnh báo|^Không claim|^Blocker|^\d+\./i.test(trimmed);
  const style = isTitle ? '<w:pPr><w:pStyle w:val="Heading2" /></w:pPr>' : '';
  return `<w:p>${style}<w:r><w:t xml:space="preserve">${xmlEscape(trimmed)}</w:t></w:r></w:p>`;
}

function buildDocumentXml(payload: NormalizedExportPayload) {
  const header = [
    'KẾ HOẠCH BÀI DẠY',
    `Tiêu đề: ${payload.title}`,
    `Cấp/lớp: ${payload.level} / lớp ${payload.grade}`,
    `Môn: ${payload.subject} | Bộ sách/nguồn: ${payload.book}`,
    `Bài/Chủ đề: ${payload.topic}`,
    `Thời lượng: ${payload.duration}`,
    `Mẫu: ${payload.template}`,
    formatList('Phương pháp', payload.methods),
    formatList('Kĩ thuật dạy học', payload.techniques),
    `Trạng thái: ${payload.lessonStatus} | Nguồn dữ liệu: ${payload.sourceStatus} | Mức hỗ trợ: ${payload.supportLevel}`,
    payload.exportWatermark ? `WATERMARK: ${payload.exportWatermark}` : 'WATERMARK: không',
    `Ghi chú giáo viên: ${payload.teacherNote}`,
    'Lưu ý: Đây là file hỗ trợ soạn giáo án; giáo viên/tổ chuyên môn cần kiểm tra chuyên môn, nguồn và bản quyền trước khi dùng chính thức.',
    ''
  ];
  const lines = [...header, ...safeLines(payload.content, 360), ...complianceLines(payload)];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${lines.map(paragraphXml).join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" />
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0" />
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal" />
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" /><w:sz w:val="24" /></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2" />
    <w:basedOn w:val="Normal" />
    <w:pPr><w:spacing w:before="240" w:after="120" /></w:pPr>
    <w:rPr><w:b /><w:sz w:val="28" /></w:rPr>
  </w:style>
</w:styles>`;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime() {
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  return { time, date };
}

function makeZip(files: Record<string, string | Buffer>) {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  const { time, date } = dosDateTime();

  for (const [name, value] of Object.entries(files)) {
    const fileName = Buffer.from(name, 'utf8');
    const data = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, fileName, data);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0, 8);
    dir.writeUInt16LE(0, 10);
    dir.writeUInt16LE(time, 12);
    dir.writeUInt16LE(date, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(fileName.length, 28);
    dir.writeUInt16LE(0, 30);
    dir.writeUInt16LE(0, 32);
    dir.writeUInt16LE(0, 34);
    dir.writeUInt16LE(0, 36);
    dir.writeUInt32LE(0, 38);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, fileName);

    offset += local.length + fileName.length + data.length;
  }

  const centralStart = offset;
  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuffer, end]);
}

export async function generateDocxBuffer(input: any) {
  const payload = normalizeExportPayload(input);
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/document.xml': buildDocumentXml(payload),
    'word/styles.xml': buildStylesXml()
  };
  return { payload, buffer: makeZip(files) };
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function asciiForPdf(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[Đđ]/g, (c) => c === 'Đ' ? 'D' : 'd')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function wrapLine(value: string, width = 88) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function generatePdfBuffer(input: any) {
  const payload = normalizeExportPayload(input);
  const sourceLines = [
    'KE HOACH BAI DAY - BAN XUAT DEMO',
    `Tieu de: ${payload.title}`,
    `Cap/lop: ${payload.level} / lop ${payload.grade}`,
    `Mon: ${payload.subject} | Bo sach/nguon: ${payload.book}`,
    `Bai/Chu de: ${payload.topic}`,
    `Thoi luong: ${payload.duration}`,
    `Trang thai: ${payload.lessonStatus}`,
    `Nguon du lieu: ${payload.sourceStatus} | Muc ho tro: ${payload.supportLevel}`,
    `Ma giao an: ${payload.lessonId || 'khong co'} | Phien ban: ${payload.currentVersion || 'chua ro'}`,
    payload.exportWatermark ? `WATERMARK: ${payload.exportWatermark}` : 'WATERMARK: khong',
    'LUU Y: PDF demo toi thieu; hay uu tien DOCX de giu tieng Viet day du va bo cuc tot hon.',
    '',
    ...safeLines(payload.content, 70),
    '',
    'PHU LUC KIEM TRA / COMPLIANCE PACKET',
    `Xuat tu saved lesson: ${payload.exportedFromSavedLesson ? 'co' : 'khong'}`,
    `Storage mode: ${payload.storageMode || 'chua xac dinh'}`,
    `Review/release: ${payload.reviewStatus} / ${payload.releaseTier}`,
    ...complianceLines(payload).slice(10, 30)
  ].flatMap((line) => wrapLine(asciiForPdf(line))).slice(0, 110);

  const textOps = ['BT', '/F1 9 Tf', '48 800 Td', '12 TL'];
  for (const line of sourceLines) {
    textOps.push(`(${pdfEscape(line)}) Tj`, 'T*');
  }
  textOps.push('ET');
  const stream = textOps.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return { payload, buffer: Buffer.from(pdf, 'utf8') };
}
