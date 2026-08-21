export type CompareNode = Record<string, unknown>;

export type ComparePair = readonly [CompareNode, CompareNode | undefined];

export type ComparePayload = {
  readonly original?: unknown;
  readonly processed?: unknown;
};

export const isCompareNode = (value: unknown): value is CompareNode => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const toCompareNodes = (value: unknown): readonly CompareNode[] => {
  return Array.isArray(value) ? value.filter(isCompareNode) : [];
};

export const nodeId = (node: CompareNode): string => String(node.id ?? node.name ?? "");

export const endpointText = (node: CompareNode | undefined): string => {
  if (!node) return "";
  const normalize = (value: unknown): string => {
    if (Array.isArray(value)) return value.map(normalize).filter(Boolean).join(",");
    return value == null ? "" : String(value).trim();
  };
  const host = normalize(node.server) || normalize(node.addresses);
  const port = normalize(node.port ?? node["local-port"]);
  return host && port ? `${host}:${port}` : host || port;
};

export const hasDisplayInfo = (node: CompareNode | undefined): boolean => {
  return Boolean(node && (node.name || node.type || endpointText(node)));
};
