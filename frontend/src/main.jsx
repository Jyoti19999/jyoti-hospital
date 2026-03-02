// src/main.jsx entrypoint for the React application. It renders the App component into the root div in index.html. It also imports global styles and print styles.
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/print.css'

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
