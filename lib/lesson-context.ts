export function buildLessonContextProfile(input: any = {}) {
  return {
    classSize: input.classSize || 'standard',
    classroomSpace: input.classroomSpace || 'regular_room',
    deviceAvailability: input.deviceAvailability || 'basic',
    learnerLevel: input.learnerLevel || 'mixed',
    durationProfile: input.durationProfile || 'standard'
  };
}
