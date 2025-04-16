import React from "react";
import ReactDOM from "react-dom/client";
import Rules from "./components/Rules";
import "./style.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Rules />
    </React.StrictMode>
  );
}
