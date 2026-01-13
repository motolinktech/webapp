import { useQuery } from "@tanstack/react-query";
import { listBranches } from "./branches.service";
import type { BranchListParams } from "./branches.types";

export function useBranches(params?: BranchListParams) {
  return useQuery({
    queryKey: ["branches", params],
    queryFn: () => listBranches(params),
  });
}
