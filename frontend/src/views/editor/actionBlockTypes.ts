export const supportedActionTypes = [
  "Region Filter",
  "Type Filter",
  "Regex Filter",
  "Flag Operator",
  "Resolve Domain Operator",
  "Regex Sort Operator",
  "Regex Delete Operator",
  "Regex Rename Operator",
  "Handle Duplicate Operator",
  "Sort Operator",
  "Script Filter",
  "Script Operator",
] as const;

export type SupportedActionType = (typeof supportedActionTypes)[number];

export const isSupportedActionType = (
  value: string,
): value is SupportedActionType =>
  supportedActionTypes.some((supportedType) => supportedType === value);
