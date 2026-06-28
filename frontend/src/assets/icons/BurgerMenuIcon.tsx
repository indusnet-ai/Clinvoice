import * as React from "react";

interface BurgerMenuIconProps {
  className?: string;
  onClick?: () => void;
}

export const BurgerMenuIcon: React.FC<BurgerMenuIconProps> = ({ className, onClick }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    onClick={onClick}
    style={{ cursor: "pointer" }}
  >
    <path d="M0 3.5H15M0 11.5H15M0 7.5H15" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
