import type { DatabaseTarget } from '../target';

export interface CompiledAppQuery {
  sql: string;
  params: unknown[];
}

export interface AppSettingsQueryTarget {
  target: DatabaseTarget;
  selectAppSettingByKey(key: string): CompiledAppQuery;
}

export function selectAppSettingByKey(
  target: AppSettingsQueryTarget,
  key: string,
): CompiledAppQuery {
  return target.selectAppSettingByKey(key);
}
