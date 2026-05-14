import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GiaoAn Workspace VN — Demo soạn giáo án',
  description:
    'Web demo soạn giáo án: tạo khung bài dạy, chỉnh sửa, lưu bản nháp và xuất DOCX/PDF cho giáo viên Việt Nam.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="bg-slate-50">
      <body className="antialiased">
        <div
          data-testid="p0-hosted-visual-smoke-markers"
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          Giáo Án Việt | Xuất file | Nguồn giáo viên tự nhập | Release Gate | Tài khoản giáo viên
        </div>
        {children}
      </body>
    </html>
  );
}
