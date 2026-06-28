import { useState } from "react";
import { Link } from "react-router-dom";
import ClickOutside from "../ClickOutside";

const DropdownMessage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [, setNotifying] = useState(true);

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <li className="relative">
        <Link
          onClick={() => {
            setNotifying(false);
            setDropdownOpen(!dropdownOpen);
          }}
          className="relative flex h-8.5 w-8.5 items-center justify-center hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
          to="#"
        >
          <svg
            className="fill-current duration-300 ease-in-out text-white"
            width="22"
            height="22"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
          >
            <g data-name="65-Calendar - Time">
              <path d="M4 4h2v2H4zM26 4h2v2h-2z" />
              <path d="M29 0H3a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h23a1 1 0 0 0 .71-.29l5-5A1 1 0 0 0 32 26V3a3 3 0 0 0-3-3zm1 25h-3a2 2 0 0 0-2 2v3H3a1 1 0 0 1-1-1V10h28zM10 8V6h12v2zm20 0h-6V5a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3H2V3a1 1 0 0 1 1-1h26a1 1 0 0 1 1 1z" />
              <path d="M16 28a8 8 0 1 0-8-8 8 8 0 0 0 8 8zm0-14a6 6 0 1 1-6 6 6 6 0 0 1 6-6z" />
              <path d="m17.29 22.71 1.41-1.41-1.7-1.71V17h-2v3a1 1 0 0 0 .29.71z" />
            </g>
          </svg>
        </Link>

        {dropdownOpen && (
          <div
            className={`absolute -right-16 mt-2.5 flex h-60 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80`}
          >
            <div className="mt-5">
              <h5 className="text-sm text-boxdark-2 text-center font-medium ">Calender</h5>
            </div>
            <div id="datepicker-inline" inline-datepicker data-date="02/25/2024"></div>
          </div>
        )}
      </li>
    </ClickOutside>
  );
};

export default DropdownMessage;
