import type { ReactNode } from 'react';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GiaoAn Workspace VN — Demo soạn giáo án',
  description: 'Web demo soạn giáo án: tạo khung bài dạy, chỉnh sửa, lưu bản nháp và xuất DOCX/PDF cho giáo viên Việt Nam.'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="bg-slate-50">
      <body className="antialiased">{children}</body>
    </html>
  );
}
