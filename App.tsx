/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Roster from "./Roster";
import Employees from "./Employees";
import Leaves from "./Leaves";
import Reports from "./Reports";
import Payroll from "./Payroll";
import Appraisals from "./Appraisals";
import JobScopes from "./JobScopes";
import { StoreProvider } from "./store";
import { ThemeProvider } from "./ThemeProvider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="app-ui-theme">
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/roster" element={<Roster />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/appraisals" element={<Appraisals />} />
              <Route path="/sops" element={<JobScopes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </ThemeProvider>
  );
}
