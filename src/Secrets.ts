export type Metadata = {
  createdTime: Date;
  customMetadata: Record<string, unknown>;
  deletionTime?: Date;
  destroyed: boolean;
  version: number;
};

export type Secret = {
  data: Record<string, unknown>;
  metadata: Metadata;
};