import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

setAuthTokenGetter(() => localStorage.getItem("token"));

// In production on Vercel, call Render directly to avoid serverless proxy issues.
const apiBase = import.meta.env.VITE_API_BASE_URL;
if (apiBase) setBaseUrl(apiBase);

createRoot(document.getElementById("root")!).render(<App />);
