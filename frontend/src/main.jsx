import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Bootstrap first, then our own stylesheet, so our variables win.
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
// Bootstrap's JavaScript, needed by anything using data-bs-toggle: the mobile
// navbar hamburger and the theme dropdown. Importing only the CSS leaves those
// controls looking right and doing nothing.
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/app.css";

import { LanguageProvider } from "./config/languageContext.jsx";
import App from "./App.jsx";
import { applyTheme, readStoredTheme } from "./config/theme.js";

// index.html already set the theme before the first paint. This keeps React
// and the DOM agreed on which one is active.
applyTheme(readStoredTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Outside App so every page, including the auth screens, can read the
          language and so the choice survives a route change. */}
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
