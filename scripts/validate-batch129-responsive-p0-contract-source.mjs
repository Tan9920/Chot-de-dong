import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const artifactPath = 'artifacts/batch129-responsive-p0-contract-last-run.json';
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const checks = [];
function check(id, ok, evidence = null) { checks.push({ id, ok: Boolean(ok), evidence }); }
let layout = '', workspace = '', css = '';
try { layout = read('app/layout.tsx'); } catch {}
try { workspace = read('components/workspace.tsx'); } catch {}
try { css = read('app/globals.css'); } catch {}
const requiredLabels = ['Tổng quan','Tạo giáo án','Bản nháp','Xuất file','Kho học liệu','Tổ chuyên môn','Góp ý','Cài đặt'];
check('layout_has_device_viewport_width', /export\s+const\s+viewport[\s\S]*width\s*:\s*['"]device-width['"]/.test(layout));
check('layout_has_initial_scale_1', /export\s+const\s+viewport[\s\S]*initialScale\s*:\s*1/.test(layout));
check('workspace_has_mobile_menu_state', /mobileMenuOpen/.test(workspace));
check('workspace_has_escape_close_effect', /keydown/.test(workspace) && /Escape/.test(workspace) && /closeMobileMenu/.test(workspace));
check('workspace_locks_body_scroll', /body\.classList\.add\(['"]mobile-menu-open['"]\)/.test(workspace) && /body\.classList\.remove\(['"]mobile-menu-open['"]\)/.test(workspace));
check('workspace_has_backdrop_close', /mobile-menu-backdrop/.test(workspace) && /onClick=\{closeMobileMenu\}/.test(workspace));
check('workspace_has_dialog_bottom_sheet', /role=\"dialog\"/.test(workspace) && /aria-modal=\"true\"/.test(workspace) && /bottom sheet|Bottom sheet|bottom sheet/.test(workspace));
check('workspace_menu_items_auto_close', /function\s+selectWorkspaceTab|const\s+selectWorkspaceTab/.test(workspace) && /setMobileMenuOpen\(false\)/.test(workspace));
check('workspace_bottom_nav_present', /className=\"bottom-nav\"/.test(workspace) && /bottom-nav-item/.test(workspace));
for (const label of requiredLabels) check(`mobile_menu_keeps_${label.replace(/\s+/g,'_').toLowerCase()}`, workspace.includes(label));
check('css_mobile_header_present', /\.mobile-header\s*\{/.test(css));
check('css_bottom_nav_present', /\.bottom-nav\s*\{/.test(css));
check('css_bottom_sheet_fixed_layer', /\.mobile-menu-layer\s*\{[\s\S]*position\s*:\s*fixed/.test(css) && /\.mobile-menu\s*\{[\s\S]*position\s*:\s*fixed/.test(css));
check('css_backdrop_present', /\.mobile-menu-backdrop\s*\{[\s\S]*background/.test(css));
check('css_body_scroll_lock_present', /body\.mobile-menu-open\s*\{[\s\S]*overflow\s*:\s*hidden/.test(css));
check('css_desktop_sidebar_hidden_on_coarse_pointer', /@media\s*\(min-width:\s*1024px\)\s*and\s*\(hover:\s*none\)|@media\s*\(min-width:\s*1024px\)\s*and\s*\(pointer:\s*coarse\)/.test(css) && /\.desktop-sidebar[\s\S]*display\s*:\s*none/.test(css));
check('css_desktop_sidebar_regular_1024', /@media\s*\(min-width:\s*1024px\)/.test(css) && /\.desktop-sidebar[\s\S]*display\s*:\s*flex/.test(css));
check('no_ai_payment_sdk_markers', !/(openai|anthropic|gemini|stripe|paypal|momo|zalopay|marketplace|referralCommission)/i.test(workspace + css));
check('source_files_exist', exists('components/workspace.tsx') && exists('app/globals.css') && exists('app/layout.tsx'));
const failed = checks.filter((c) => !c.ok).map((c) => c.id);
const report = { ok: failed.length === 0, generatedAt: new Date().toISOString(), batch: 129, name: 'P0 responsive/mobile navigation contract', checks, failed, note: 'Source-level responsive contract for the original P0 mobile/sidebar blocker. This does not replace browser screenshot testing.', noAiPaymentVerifiedFakeAdded: true };
fs.mkdirSync(path.dirname(path.join(root, artifactPath)), { recursive: true });
fs.writeFileSync(path.join(root, artifactPath), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
