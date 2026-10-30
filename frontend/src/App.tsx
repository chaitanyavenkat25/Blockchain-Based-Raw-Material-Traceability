import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MainLayout } from "./layouts/MainLayout";

// Pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { BatchesList } from "./pages/BatchesList";
import { BatchDetails } from "./pages/BatchDetails";
import { NewBatch } from "./pages/NewBatch";
import { Certificates } from "./pages/Certificates";
import { GenealogyView } from "./pages/GenealogyView";
import { Suppliers } from "./pages/Suppliers";
import { AuditorView } from "./pages/AuditorView";
import { BlockchainExplorer } from "./pages/BlockchainExplorer";
import { QRScannerPage } from "./pages/QRScannerPage";
import { PublicVerify } from "./pages/PublicVerify";
import { AuditLogs } from "./pages/AuditLogs";
import { Profile } from "./pages/Profile";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Consumer QR Verification Route */}
          <Route path="/public/verify/:batchId" element={<PublicVerify />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/batches" element={<BatchesList />} />
            <Route path="/batches/new" element={<NewBatch />} />
            <Route path="/batches/:id" element={<BatchDetails />} />
            <Route path="/genealogy/:batchId" element={<GenealogyView />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/auditor" element={<AuditorView />} />
            <Route path="/blockchain" element={<BlockchainExplorer />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/qr-scanner" element={<QRScannerPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
