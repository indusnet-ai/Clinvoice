import * as React from "react";
import { SVGProps } from "react";

interface DropDownIconprops extends SVGProps<SVGSVGElement> {
  color?: string;
}
export const DropDownIcon: React.FC<DropDownIconprops> = ({ color = "#6070FF", ...props }) => (
  <svg
    width={14}
    height={14}
    cursor={"pointer"}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.5 5.25L7 8.75L10.5 5.25"
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
