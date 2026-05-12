export async function buildGuardedExportPayload(input: any, _settings: any, reviewerName = 'Demo') {
  return { ...input, compliancePacket: { reviewerName, generatedAt: new Date().toISOString(), warning: 'Demo export; seed/scaffold chưa verified.' } };
}
