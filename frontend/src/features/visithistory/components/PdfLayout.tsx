import React from "react";

type PdfLayoutProps = {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  watermarkText?: string;
};

function PdfLayout({ header, footer, children, className = "", watermarkText }: PdfLayoutProps) {
  return (
    <div className={`pdf-wrapper relative bg-white rounded-lg shadow-lg p-6 ${className}`.trim()}>
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        .pdf-wrapper {
          --pdf-x-padding: 8mm;
          --pdf-header-height: 64mm;
          --pdf-footer-height: 22mm;
        }

        .pdf-wrapper-table {
          width: 100%;
          border-collapse: collapse;
          position: relative;
          z-index: 2;
        }

        .pdf-wrapper-table td {
          vertical-align: top;
          padding: 0;
        }

        .pdf-wrapper-header {
          padding-bottom: 8px;
          border-bottom: 1px solid #01030f;
        }

        .pdf-wrapper-content {
          padding: 12px 0;
        }

        .pdf-wrapper-footer {
          padding-top: 8px;
          border-top: 1px solid #d1d5db;
        }

        .pdf-wrapper-page-number {
          display: inline-block;
          min-width: 80px;
          text-align: center;
        }

        .pdf-avoid-break {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .pdf-watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
        }

        .pdf-watermark-text {
          font-size: 58px;
          font-weight: 800;
          line-height: 1;
          color: #8f98b322;
          white-space: nowrap;
        }

        .pdf-fixed-header,
        .pdf-fixed-footer,
        .pdf-print-only {
          display: none;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .pdf-print-root {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .pdf-wrapper {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            background: white !important;
          }

          .pdf-screen-only {
            display: none !important;
          }

          .pdf-print-only {
            display: block !important;
          }

          .pdf-wrapper-table thead {
            display: table-header-group;
          }

          .pdf-wrapper-table tfoot {
            display: table-footer-group;
          }

          .pdf-page-header-space {
            height: var(--pdf-header-height);
          }

          .pdf-page-footer-space {
            height: var(--pdf-footer-height);
            position: relative;
          }

          .pdf-wrapper-content {
            padding: 0 var(--pdf-x-padding) !important;
          }

          .pdf-fixed-header,
          .pdf-fixed-footer {
            position: fixed;
            left: 0;
            right: 0;
            z-index: 999;
            background: white;
            display: block;
          }

          .pdf-fixed-header {
            top: 0;
            height: var(--pdf-header-height);
            padding: 3mm var(--pdf-x-padding) 2mm;
            border-bottom: 1px solid #01030f;
          }

          .pdf-fixed-footer {
            bottom: 0;
            height: var(--pdf-footer-height);
            padding: 2mm var(--pdf-x-padding) 1mm;
            border-top: 1px solid #d1d5db;
          }

          .pdf-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .pdf-keep-with-next {
            break-after: avoid-page !important;
            page-break-after: avoid !important;
          }

          .pdf-medication-start {
            display: table;
            width: 100%;
          }

          .pdf-watermark {
            position: fixed;
          }

          .pdf-wrapper-page-number {
            visibility: hidden;
          }

          .pdf-page-footer-space::after {
            content: "Page " counter(page);
            position: absolute;
            left: 50%;
            bottom: 2mm;
            transform: translateX(-50%);
            font-size: 11px;
            line-height: 1;
            color: #8f98b3;
            font-weight: 500;
          }
        }
      `}</style>

      {!!watermarkText && (
        <div className="pdf-watermark" aria-hidden>
          <span className="pdf-watermark-text">{watermarkText}</span>
        </div>
      )}

      <div className="pdf-fixed-header">{header}</div>
      <div className="pdf-fixed-footer">{footer}</div>

      <table className="pdf-wrapper-table">
        <thead>
          <tr>
            <td>
              <div className="pdf-screen-only pdf-wrapper-header">{header}</div>
              <div className="pdf-print-only pdf-page-header-space" />
            </td>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td>
              <div className="pdf-screen-only pdf-wrapper-footer">{footer}</div>
              <div className="pdf-print-only pdf-page-footer-space" />
            </td>
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td>
              <div className="pdf-wrapper-content">{children}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default PdfLayout;
