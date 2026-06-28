// DataTable.tsx
import React from "react";
import { Column } from "./types";
import { NoDataFallBack } from "../NoDataFallBack";

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  height?: string;
  headerHeight?: number; // px
  rowHeight?: number; // px
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  height = "500px",
  headerHeight = 48,
  rowHeight = 70,
}: DataTableProps<T>) {
  const leftPinned = columns.filter((c) => c.pinned === "left");
  const rightPinned = columns.filter((c) => c.pinned === "right");
  const normal = columns.filter((c) => !c.pinned);

  const orderedColumns = [...leftPinned, ...normal, ...rightPinned];

  return (
    <div
      className="relative rounded overflow-hidden bg-white"
      style={{
        ["--table-header-height" as any]: `${headerHeight}px`,
        ["--table-row-height" as any]: `${rowHeight}px`,
      }}
    >
      <div className="overflow-auto hide-scrollbar" style={{ maxHeight: height }}>
        <table className="min-w-full">
          {/* ---------- HEADER ---------- */}
          <thead className="sticky top-0 bg-[#FDFDFD] z-20">
            <tr>
              {/* Empty stamp header */}
              <th style={{ width: "4px", minWidth: "4px" }} className="bg-[#FDFDFD]" />
              {orderedColumns.map((col, index) => (
                <th
                  key={index}
                  className={`text-[12px] font-semibold text-[#01030F] px-4 py-3 bg-[#FDFDFD]
                   ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                    ${col.pinned ? "sticky z-20 bg-[#FDFDFD]" : ""}
                  `}
                  style={{
                    height: "var(--table-header-height)",
                    minWidth: col.minWidth,
                    maxWidth: col.maxWidth,
                    left: col.pinned === "left" ? `${index * 150}px` : undefined,
                    right: col.pinned === "right" ? "0px" : undefined,
                  }}
                >
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>

          {/* ---------- BODY ---------- */}

          <tbody>
            {/* Spacer */}
            <tr>
              <td colSpan={orderedColumns.length + 1} className="h-2 bg-[#F6F6FE]"></td>
            </tr>
            {rows.map((row, rowIndex) => (
              <React.Fragment key={rowKey?.(row, rowIndex) ?? rowIndex}>
                <tr className="hover:bg-gray-50">
                  {/* LEFT STAMP */}
                  <td
                    className="bg-[#6070FF] rounded-l-md"
                    style={{
                      width: "4px",
                      minWidth: "4px",
                      padding: 0,
                    }}
                  />
                  {orderedColumns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 text-[12px] font-medium text-[#01030F] bg-white
                            ${col.align === "right" ? "text-right" : "text-left"}
                            ${col.pinned ? "sticky z-10" : ""}
                           `}
                      style={{
                        height: "var(--table-row-height)",
                        minWidth: col.minWidth,
                        maxWidth: col.maxWidth,
                        left: col.pinned === "left" ? `${colIndex * 150}px` : undefined,
                        right: col.pinned === "right" ? "0px" : undefined,
                      }}
                    >
                      {col.renderCell ? col.renderCell(row) : (row as any)[col.field]}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td colSpan={orderedColumns.length + 1} className="h-1 bg-[#F6F6FE]" />
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
