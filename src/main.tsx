import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { DocsViewer } from './ui/DocsViewer';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/docs" element={<DocsViewer />} />
        <Route path="/docs/:category/:doc" element={<DocsViewer />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
