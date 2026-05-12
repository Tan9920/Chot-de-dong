let assets: any[] = [];
export async function readLegalAssets(..._args: any[]) { return assets; }
export async function createLegalAssetRecord(input: any = {}, ..._args: any[]) { const item = { id: 'asset-' + Date.now(), status: 'pending_review', ...input }; assets.unshift(item); return item; }
export async function reviewLegalAssetRecord(id: string, input: any = {}, ..._args: any[]) { const item = { id, status: input.decision || 'reviewed', ...input }; assets = [item, ...assets.filter((a)=>a.id!==id)]; return item; }
export async function requestLegalAssetTakedown(id: string, input: any = {}, ..._args: any[]) { return { id, status: 'takedown_requested', ...input }; }
