import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { BrowserRouter as Router } from "react-router-dom";
import "./main.css";
import "./css/style.css";

import { ToastContainer } from "react-toastify";
import "./global.css";
import { LanguageProvider } from "./language/context/LanguageContext";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { NavigationGuardProvider } from "./app/navigation/NavigationGaurdContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <Provider store={store}>
          <Router>
            <NavigationGuardProvider>
              <ToastContainer position="top-right" style={{ zIndex: 10000 }} />
              <App />
            </NavigationGuardProvider>
          </Router>
        </Provider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
