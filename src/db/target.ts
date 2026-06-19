export type ImplementedDatabaseTarget = 'd1';
export type FutureDatabaseTarget = 'pg' | 'mysql';
export type DatabaseTarget = ImplementedDatabaseTarget | FutureDatabaseTarget;

const implementedTargets = new Set<string>(['d1']);
const knownTargets = new Set<string>(['d1', 'pg', 'mysql']);

export function parseDatabaseTarget(
  value: string | undefined,
): ImplementedDatabaseTarget {
  const target = value ?? 'd1';

  if (!knownTargets.has(target)) {
    throw new Error(`Unknown database target ${target}`);
  }

  if (!implementedTargets.has(target)) {
    throw new Error(`Database target ${target} is not implemented`);
  }

  return target as ImplementedDatabaseTarget;
}
