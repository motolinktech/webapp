import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { GlobalProvider } from "./contexts/global-context.tsx";
import * as TanStackQueryProvider from "./contexts/tanstack-query/root-provider.tsx";

import { routeTree } from "./routeTree.gen";

import "./styles.css";
import { Toaster } from "./components/ui/sonner.tsx";
import reportWebVitals from "./reportWebVitals.ts";

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();
const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <GlobalProvider>
          <RouterProvider router={router} />
        </GlobalProvider>
        <Toaster position="top-center" duration={4000} richColors={true} />
      </TanStackQueryProvider.Provider>
    </StrictMode>,
  );
}

reportWebVitals();
