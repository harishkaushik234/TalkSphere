import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Suppress daisyUI console message
if (typeof window !== "undefined") {
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args[0]?.toString() || "";
    // Suppress daisyUI info message
    if (message.includes("daisyUI") || message.includes("themes added")) {
      return;
    }
    originalLog(...args);
  };
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
