import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import "./index.css";
import App from "./App.tsx";
import { queryClient, CACHE_MAX_AGE } from "./lib/collections";

const persister = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del },
});

const [, restored] = persistQueryClient({ queryClient, persister, maxAge: CACHE_MAX_AGE });

const render = () =>
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

void restored.then(render, render);
