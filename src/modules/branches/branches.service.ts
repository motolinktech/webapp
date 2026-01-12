import { authApi } from "@/lib/services/api";
import type { BranchListParams, BranchListResponse } from "./branches.types";

export async function listBranches(
	params?: BranchListParams,
): Promise<BranchListResponse> {
	const response = await authApi.get<BranchListResponse>("/branches", {
		params,
	});
	return response.data;
}
