

import { LocalStorage } from "@/services";

interface Permission {
  module: string;
  permission: string[];
}

export const isPermitted = (module?: string, action?: string): boolean => {
  if (!module || !action) return false;

  const permissions: Permission[] = LocalStorage.read("permission") || [];

  const targetModule = permissions.find((perm) => perm.module === module);

  if (!targetModule) return false;

  const matchedAction = targetModule.permission.find((perm) =>
    perm.startsWith(action)
  );

  if (!matchedAction) return false;

  const [, accessType] = matchedAction.split(":");

  return accessType === "any";
};
