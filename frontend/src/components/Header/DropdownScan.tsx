import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import { Html5QrcodeScanner } from 'html5-qrcode';

const DropdownScan = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(false);

  const handleQROpen = () => {
    try {
      // Only initialize the scanner if it hasn't been initialized before
      if (!scannerInitialized) {
        const config = {
          fps: 5, // Frames per second for scanning
          rememberLastUsedCamera: true,
          qrbox: { width: 500, height: 500 }, // Size of the QR code scanning box
        };

        const scanner = new Html5QrcodeScanner(
          'reader', // The ID of the HTML element where the scanner will render
          config,
          false, // Verbose mode (set to true to enable logging)
        );

        // Success callback for QR code detection
        const success = (decodedText: string) => {
          scanner.clear().then(() => {
          });
        };

        // Error callback for failed QR code scans
        const error = (err: any) => {
          console.log(`Error scanning QR code: ${err}`);
        };

        // Render the scanner
        scanner.render(success, error);

        // Set scanner as initialized
        setScannerInitialized(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <li className="relative">
        <Link
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            handleQROpen(); // Trigger QR scanner when dropdown is toggled
          }}
          className="relative flex h-8.5 w-8.5 items-center justify-center hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
          to="#"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            className="fill-current duration-300 ease-in-out text-white"
          >
            <path d="M4 4h5V2H2v7h2V4zM4 15H2v7h7v-2H4v-5zM15 2v2h5v5h2V2h-7zM20 20h-5v2h7v-7h-2v5zM2 11h20v2H2z" />
          </svg>
        </Link>

        {/* Dropdown Start */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2.5 flex h-[800px] w-400 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:w-[1000px]">
            <div className="mt-5">
              <h5 className="text-boxdark-2 text-left mb-4 mt-0 text-title-sm pl-5 font-medium">
                QR Scanner
              </h5>
            </div>
            <div id="reader"></div> {/* QR code scanner will render here */}
          </div>
        )}
        {/* Dropdown End */}
      </li>
    </ClickOutside>
  );
};

export default DropdownScan;
