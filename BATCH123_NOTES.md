# Batch123 — P0 Responsive Navigation/Layout Closure

Scope: one P0 UI/runtime-facing fix only. This batch focuses on the reported mobile/desktop responsive navigation issue and does not add AI, payment, marketplace, cash rewards, public community auto-publish, or fake verified academic data.

## What changed
- `components/workspace.tsx`
  - Removed Tailwind `lg:hidden` / `hidden lg:flex` display coupling from the shell navigation so custom CSS owns the mobile/tablet/desktop split.
  - Kept the desktop sidebar and desktop header as desktop-only surfaces.
  - Converted the mobile “Khác” menu from a top/side drawer-like layer into a bottom-sheet dialog.
  - Kept explicit close controls: X button, backdrop click, Escape key, menu item auto-close, and body scroll lock while open.
  - Added the required mobile sheet entries so the teacher can still access: Tổng quan, Tạo giáo án, Bản nháp, Xuất file, Kho học liệu, Tổ chuyên môn, Góp ý, Cài đặt.

- `app/globals.css`
  - Desktop sidebar/header are hidden by default and only shown on desktop breakpoint.
  - Mobile header/bottom nav/bottom sheet remain the default for mobile and tablet-like layouts.
  - Added a coarse-pointer override so real phones using browser “desktop site” do not get trapped behind a desktop sidebar.
  - Bottom sheet now opens from the bottom, uses a backdrop, has a grab handle, bounded height, and prevents horizontal overflow.

- `app/layout.tsx`
  - Added viewport metadata with `width=device-width` and `initial-scale=1`.

## Verification run in this environment
- `unzip -t`: pass on original Batch122 ZIP before editing.
- `npm run lint`: pass; source validators ok.
- `npm run data:validate`: pass; checked 55, failed 0.
- `npm run typecheck`: pass after removing unavailable `Viewport` named type import.
- `npm run build`: fail; Next binary missing because dependencies are not installed in this clean extracted workspace.

## Still not proven
- No hosted visual screenshot test was run.
- No Playwright/browser breakpoint capture was run.
- No production build proof because `node_modules/next/dist/bin/next` is missing until `npm ci` completes.
