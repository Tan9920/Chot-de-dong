# Batch 2 upgrade notes

- Structured grade 6 core subject data moved to `data/seed/*.json`.
- Added validation/data loader in `lib/curriculum-data.ts`.
- Split pedagogy library into `lib/pedagogy.ts`.
- Workspace now shows coverage and topic recommendations.
- Generator now falls back to topic recommendations.
- Prisma seed updated for school settings and looser client availability.
