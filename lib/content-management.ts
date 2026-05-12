import { demoTemplates, okSummary } from './demo-data';

function summary(name = 'demo') {
  return { id: name, exportedAt: new Date().toISOString(), items: [], summary: { total: 0, blockers: 0, warnings: 0 }, note: 'Deployable demo fallback: source ZIP thiếu lib gốc nên route trả dữ liệu an toàn tối thiểu.' };
}

const handler: ProxyHandler<any> = {
  get(_target, prop: string) {
    if (prop === 'listTemplates') return async () => demoTemplates;
    if (prop === 'getSummary') return async () => ({ templates: demoTemplates.length, recentAudits: [], recentImports: [] });
    if (prop === 'listAuditLogs') return async () => [];
    if (prop === 'listImportBatches') return async () => [];
    if (prop === 'listContent') return async () => [];
    if (prop === 'upsertContent') return async (_user: any, entity: any, payload: any) => ({ id: payload?.id || `content-${Date.now()}`, entity, ...payload });
    if (prop === 'deleteContent') return async () => ({ ok: true });
    if (prop === 'reviewContent') return async (_user: any, entity: any, payload: any) => ({ id: payload?.id || 'reviewed', entity, ...payload });
    if (prop === 'updateLifecycle' || prop === 'updateSourceStatus') return async (_user: any, entity: any, payload: any) => ({ id: payload?.id || 'item', entity, ...payload });
    if (prop === 'parseManifest') return async (_text: string) => ({ items: [], warnings: [] });
    if (prop === 'importManifest') return async () => ({ ok: true, imported: 0 });
    if (prop === 'previewGeneratedPackImport') return async () => ({ items: [], selection: null, summary: okSummary() });
    if (prop === 'importGeneratedPackSelection') return async () => ({ ok: true, imported: 0, skipped: 0 });
    if (prop === 'getPackReleaseSnapshot') return async () => ({ releaseTier: 'internal_preview', supportLevel: 'starter', sourceStatus: 'seed', blockerCount: 0 });
    if (prop === 'getPackReleaseManifest') return async () => ({ packId: 'demo-pack', releaseTier: 'internal_preview', blockers: [] });
    if (prop.startsWith('get')) return async () => summary(prop);
    if (prop.startsWith('preview')) return async () => summary(prop);
    if (prop.startsWith('import')) return async () => ({ ok: true, imported: 0, summary: summary(prop) });
    if (prop.startsWith('apply')) return async () => ({ ok: true, changed: 0, summary: summary(prop) });
    if (prop.startsWith('add') || prop.startsWith('set')) return async () => ({ ok: true, result: summary(prop) });
    return async () => summary(prop);
  }
};

export const contentManagement: any = new Proxy({}, handler);
