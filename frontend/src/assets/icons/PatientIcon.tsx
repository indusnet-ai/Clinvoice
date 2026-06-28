import * as React from "react";
import { SVGProps } from "react";

export const PatientIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM5 5H19V7H5V5ZM19 19H5V9H19V19ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z"
      fill="currentColor"
    />
  </svg>
);
