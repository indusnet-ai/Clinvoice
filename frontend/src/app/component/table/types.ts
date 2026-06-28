// types.ts
export interface Column<T = any> {
  field: keyof T | string;
  headerName: string;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  pinned?: "left" | "right";
  renderCell?: (row: T) => React.ReactNode;
}
