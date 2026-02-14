import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BottomNav } from "./components/navigation/BottomNav";
import { useIsMobile } from "./hooks/useIsMobile";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";
import { usePWAUpdate } from "./hooks/usePWAUpdate";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import { useErrorMonitoring } from "./hooks/useErrorMonitoring";
import { Book } from "lucide-react";
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from "./components/system/ErrorBoundary";

// Lazy load pages for code splitting and better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Library = lazy(() => import("./pages/Library"));
const Profile = lazy(() => import("./pages/Profile"));
const EbookDetail = lazy(() => import("./pages/EbookDetail"));
const Reader = lazy(() => import("./pages/Reader"));
const SampleReader = lazy(() => import("./pages/SampleReader"));
const AdminUpload = lazy(() => import("./pages/AdminUpload"));
const AdminManage = lazy(() => import("./pages/AdminManage"));
const AdminSeed = lazy(() => import("./pages/AdminSeed"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminWhitelabelSetup = lazy(() => import("./pages/AdminWhitelabelSetup"));
const AdminPush = lazy(() => import("./pages/AdminPush"));
const AdminProvision = lazy(() => import("./pages/AdminProvision"));
const Community = lazy(() => import("./pages/Community"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Packages = lazy(() => import("./pages/Packages"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage").then(module => ({ default: module.ReviewsPage })));
const GalleryPage = lazy(() => import("./pages/GalleryPage").then(module => ({ default: module.GalleryPage })));
const Install = lazy(() => import("./pages/Install"));
const Recovery = lazy(() => import("./pages/Recovery"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <Book className="h-12 w-12 animate-pulse text-primary" />
      <p className="text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const AppContent = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  usePWAUpdate(); // Initialize PWA update detection
  useSessionTimeout(30); // 30 minutes inactivity timeout
  useErrorMonitoring(); // Error monitoring and logging
  
  // Hide bottom nav on home page, reader pages, or when not logged in
  const hideBottomNav = 
    /^\/(ebook|reader|sample)\//.test(location.pathname) ||
    location.pathname === '/' ||
    !user;

  return (
    <>
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/community" element={<Community />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/user/:userId" element={<PublicProfile />} />
          <Route path="/ebook/:id" element={<EbookDetail />} />
          <Route path="/reader/:id" element={<Reader />} />
          <Route path="/sample/:id" element={<SampleReader />} />
          <Route path="/admin/upload" element={<AdminUpload />} />
          <Route path="/admin/manage" element={<AdminManage />} />
          <Route path="/admin/seed" element={<AdminSeed />} />
          <Route path="/admin/push" element={<AdminPush />} />
          <Route path="/admin/setup" element={<AdminWhitelabelSetup />} />
          <Route path="/admin/provision" element={<AdminProvision />} />
          {/* Secret admin config route for MCP settings */}
          <Route path="/admin/mcp-config-6c11a922" element={<AdminSettings />} />
          <Route path="/ebook/:id/reviews" element={<ReviewsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/instalar" element={<Install />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {isMobile && !hideBottomNav && <BottomNav />}
    </>
  );
};

const App = () => {
  useEffect(() => {
    // Ensure boot failsafe overlay is hidden when React mounts successfully
    const failsafe = document.getElementById('boot-failsafe');
    if (failsafe) {
      failsafe.classList.add('hidden');
    }
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
