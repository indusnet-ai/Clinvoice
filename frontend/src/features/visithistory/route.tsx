import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DefaultLayout from "@/layout/DefaultLayout";
import Summary from "./pages/Summary";
import PDF from "./pages/Pdf";
import SoapNotes from "./pages/SoapNotes";
import DentalPDF from "./pages/DentalPDF";

export const visitRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DefaultLayout />,
        children: [
          { path: "visithistory/soapnotes", element: <SoapNotes /> },
          { path: "visithistory/summary", element: <Summary /> },
          { path: "visithistory/pdf", element: <PDF /> },
          { path: "visithistory/dentalpdf", element: <DentalPDF /> },
        ],
      },
    ],
  },
];
