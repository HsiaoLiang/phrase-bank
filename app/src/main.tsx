import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BankProvider } from "./lib/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BankProvider>
      <App />
    </BankProvider>
  </StrictMode>,
);
