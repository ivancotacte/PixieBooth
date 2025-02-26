import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import PhotoBooth from "./pages/PhotoBooth";
import PhotoPreview from "./pages/PhotoPreview";
import './App.css'

function App() {
  const [capturedImages, setCapturedImages] = useState([]);
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Navigate replace to="/photobooth" />} />
          <Route path="/" element={<Navigate replace to="/photobooth" />} />
          <Route path="/photobooth" element={<PhotoBooth setCapturedImages={setCapturedImages} />} />
          <Route path="/preview" element={<PhotoPreview capturedImages={capturedImages} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;