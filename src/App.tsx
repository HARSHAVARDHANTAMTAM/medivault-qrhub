import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PatientRegister from "./pages/patient/PatientRegister";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import HospitalRegister from "./pages/hospital/HospitalRegister";
import HospitalLogin from "./pages/hospital/HospitalLogin";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import QRScanner from "./pages/hospital/QRScanner";
import PatientHistory from "./pages/hospital/PatientHistory";
import UploadReport from "./pages/hospital/UploadReport";
import HospitalProfile from "./pages/hospital/HospitalProfile";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Patient Routes */}
            <Route path="/patient/register" element={<PatientRegister />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route 
              path="/patient/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/profile" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientProfile />
                </ProtectedRoute>
              } 
            />
            {/* Hospital Routes */}
            <Route path="/hospital/register" element={<HospitalRegister />} />
            <Route path="/hospital/login" element={<HospitalLogin />} />
            <Route 
              path="/hospital/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <HospitalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/scan" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <QRScanner />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/patient/:patientId" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <PatientHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/upload" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <UploadReport />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/profile" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <HospitalProfile />
                </ProtectedRoute>
              } 
            />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
