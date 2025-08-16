import React from "react";
import { HashRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <MainLayout />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
