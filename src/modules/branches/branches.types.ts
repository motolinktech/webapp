export interface Branch {
	id: string;
	name: string;
	address: string;
  code: string;
	createdAt: string;
	updatedAt: string;
}

export interface BranchListParams {
	page?: number;
	limit?: number;
	search?: string;
}

export interface BranchListResponse {
	data: Branch[];
	count: number;
}
