import Feedback from './journal/Feedback.jsx';

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Feedback />
    <App />
  </React.StrictMode>
);
