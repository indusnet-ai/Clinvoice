import * as React from "react";
import { SVGProps } from "react";
export const LeftArrowIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={32} height={32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g filter="url(#filter0_d_9600_3259)">
      <circle cx={16} cy={16} r={12} fill="white" />
    </g>
    <path d="M19 22L13 16L19 10" stroke="#01030F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <filter
        id="filter0_d_9600_3259"
        x={0}
        y={0}
        width={32}
        height={32}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9600_3259" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9600_3259" result="shape" />
      </filter>
    </defs>
  </svg>
);
