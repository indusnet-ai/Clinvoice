import * as React from "react";
import { SVGProps } from "react";

interface ButtonArrowProps extends SVGProps<SVGSVGElement> {
  color?: string;
}
export const ButtonArrow: React.FC<ButtonArrowProps> = ({ color = "white", ...props }) => (
  <svg width={13} height={10} viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M1 5H11.6667M11.6667 5L7.66667 1M11.6667 5L7.66667 9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
