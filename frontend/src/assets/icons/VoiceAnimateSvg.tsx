import * as React from "react";
import { SVGProps } from "react";
export const VoiceAnimateSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg width={177} height={174} viewBox="0 0 177 174" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g filter="url(#filter0_f_9693_11433)">
      <circle
        cx={93.2704}
        cy={80.1951}
        r={59}
        transform="rotate(135.553 93.2704 80.1951)"
        fill="url(#paint0_linear_9693_11433)"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_9693_11433"
        x={-0.000404358}
        y={-13.0746}
        width={186.54}
        height={186.54}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur stdDeviation={17.135} result="effect1_foregroundBlur_9693_11433" />
      </filter>
      <linearGradient
        id="paint0_linear_9693_11433"
        x1={46.4675}
        y1={29.3265}
        x2={128.822}
        y2={139.195}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#6100FF" />
        <stop offset={1} stopColor="#00FFFF" stopOpacity={0} />
      </linearGradient>
    </defs>
  </svg>
);
