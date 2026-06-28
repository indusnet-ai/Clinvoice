import { DropDownIcon } from "@/assets/icons";
import { useLanguage } from "@/language/context/LanguageContext";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;

  pageSizeOptions?: number[];

  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
}) => {
  const { t } = useLanguage();
  const totalPages = Math.ceil(total / pageSize);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const getPages = () => {
    const pages: (number | "...")[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 z-21 bg-[#F6F6FE] sticky bottom-0">
      {/* Left: Rows per page */}
      <div className="flex items-center gap-2 text-[12px] font-normal text-[#5B657A]">
        <span>{t("pagination.rowsPerPage")}</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1); // reset page
            }}
            className="border-[1.4px] outline-0 border-[#6070FF] text-[#6070FF] text-sm font-medium rounded-md px-2 py-1 focus:border-[#6070FF] appearance-none pr-6"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <DropDownIcon className="absolute top-2 right-2 pointer-events-none" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Center: Results info */}
        <div className="text-[12px] font-normal text-[#5B657A]">
          {t("pagination.results")} {start} – {end} {t("pagination.of")} {total}
        </div>

        {/* Right: Page controls */}
        <div className="flex items-center gap-1 text-sm">
          <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="px-2 disabled:opacity-40">
            ‹
          </button>

          {getPages().map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2">
                …
              </span>
            ) : (
              <button
                key={`page-${p}-${idx}`}
                onClick={() => onPageChange(p)}
                className={`px-2 py-1 text-[12px] font-medium rounded-full ${
                  p === page ? "bg-[#6070FF] text-white shadow-lg shadow-[#6070FF]" : "hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};
