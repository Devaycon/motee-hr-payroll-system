"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store";
import { initBranchPersistence } from "./branch-persistence";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // The only thing still kept in the browser is a view preference: which
    // branch the navbar is scoped to. Records live on the server.
    initBranchPersistence();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
