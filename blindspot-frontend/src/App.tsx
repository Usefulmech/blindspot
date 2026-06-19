import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Home } from "./pages/Home";
import { Analyze } from "./pages/Analyze";
import { Dashboard } from "./pages/Dashboard";
import { Decisions } from "./pages/Decisions";
import { Advisor } from "./pages/Advisor";
import { Report } from "./pages/Report";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Every route lives inside AppLayout → nav is always visible */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/report/:uuid" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
