export type ToolLoadingContent = {
  tool: string;
  isLoading: boolean;
  message?: string | null;
};

export type QueryLoadingContent = {
  isLoading: boolean;
  taskNames: string[];
  message?: string;
};

export type DataStreamDeltaType =
  | 'user-message-id'
  | 'tool-loading'
  | 'query-loading';

export type DataStreamDelta = {
  type: DataStreamDeltaType;
  content: string | ToolLoadingContent | QueryLoadingContent;
};
