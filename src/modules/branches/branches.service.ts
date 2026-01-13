import { authApi } from "@/lib/services/api";
import type { Branch, BranchListParams, BranchListResponse } from "./branches.types";

const BRANCH_KEY = "motolink_selected_branch";

export async function listBranches(params?: BranchListParams): Promise<BranchListResponse> {
  const response = await authApi.get<BranchListResponse>("/branches", {
    params,
  });
  return response.data;
}

export function getStoreBranch(): Branch | null {
  const branch = localStorage.getItem(BRANCH_KEY);

  if (!branch) return null;

  try {
    return JSON.parse(branch);
  } catch {
    localStorage.removeItem(BRANCH_KEY);
    return null;
  }
}

export function setStoreBranch(branch: Branch): void {
  localStorage.setItem(BRANCH_KEY, JSON.stringify(branch));
}
