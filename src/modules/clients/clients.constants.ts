import type { BadgeSelectOption } from "@/components/composite/badge-select";

export const BAGS_STATUS = {
  OWN: "OWN",
  COMPANY: "COMPANY",
  NONE: "NONE",
} as const;

export type BagsStatus = (typeof BAGS_STATUS)[keyof typeof BAGS_STATUS];

export const BAGS_STATUS_OPTIONS: BadgeSelectOption[] = [
  { value: BAGS_STATUS.OWN, label: "Bags Próprios" },
  { value: BAGS_STATUS.COMPANY, label: "Bags da Empresa" },
  { value: BAGS_STATUS.NONE, label: "Sem Bags" },
];
