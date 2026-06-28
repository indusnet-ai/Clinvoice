import { DropDownIcon } from "@/assets/icons";
import { useField } from "formik";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  name: string;
  brand: string;
}
interface Props {
  name: string;
  options: Option[];
}
export const FormCustomSelect = ({ name, options }: Props) => {
  const [field, , helpers] = useField(name);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === field.value);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // Update position when dropdown opens or on scroll/resize
  useEffect(() => {
    if (open && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        setPos({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      };

      updatePosition();

      // Update position on scroll or resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [open]);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restore scroll position
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  // Close dropdown on scroll outside
  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Check if scroll is happening outside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      // Listen to scroll events on the entire document (capture phase)
      document.addEventListener("scroll", handleScroll, true);
      return () => document.removeEventListener("scroll", handleScroll, true);
    }
  }, [open]);

  return (
    <>
      {/* TRIGGER */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-11 flex items-center justify-between px-3 border border-gray-400 rounded-lg bg-white"
      >
        {selected ? (
          <div className="text-left">
            <p className="text-xs font-medium">{selected.name}</p>
            <p className="text-[10px] text-gray-500">{selected.brand}</p>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Select medicine</span>
        )}
        <DropDownIcon />
      </button>

      {/* DROPDOWN (PORTAL) */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={
              {
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                width: `${pos.width}px`,
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // IE and Edge
              } as React.CSSProperties & { scrollbarWidth?: string; msOverflowStyle?: string }
            }
            className="fixed z-9999 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden"
            onWheel={(e) => {
              // Prevent event from bubbling to parent
              e.stopPropagation();
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  helpers.setValue(opt.value);
                  setOpen(false);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              >
                <p className="text-sm font-semibold">{opt.name}</p>
                <p className="text-xs text-gray-500">{opt.brand}</p>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};
