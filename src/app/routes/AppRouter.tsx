import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { SearchLayout } from "@/app/layouts/SearchLayout";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { AgentLayout } from "@/app/layouts/AgentLayout";
import { ProtectedRoute } from "@/app/layouts/ProtectedRoute";
import { pageTransition } from "@/utils/motion";
import { motion } from "framer-motion";

const HomePage = lazy(() => import("@/features/home/HomePage"));
const SearchPage = lazy(() => import("@/features/search/SearchPage"));
const PropertyDetailPage = lazy(() => import("@/features/public/PropertyDetailPage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import("@/features/auth/ForgotPasswordPage"));
const UserDashboardPage = lazy(() => import("@/features/dashboard/UserDashboardPage"));
const SavedListingsPage = lazy(() => import("@/features/dashboard/SavedListingsPage"));
const SavedSearchesPage = lazy(() => import("@/features/dashboard/SavedSearchesPage"));
const PropertyAlertsPage = lazy(() => import("@/features/dashboard/PropertyAlertsPage"));
const ProfileSettingsPage = lazy(() => import("@/features/dashboard/ProfileSettingsPage"));
const AccountSecurityPage = lazy(() => import("@/features/dashboard/AccountSecurityPage"));
const AgentOverviewPage = lazy(() => import("@/features/agent-dashboard/AgentOverviewPage"));
const ListingsManagementPage = lazy(() => import("@/features/agent-dashboard/ListingsManagementPage"));
const AddListingPage = lazy(() => import("@/features/agent-dashboard/AddListingPage"));
const EditListingPage = lazy(() => import("@/features/agent-dashboard/EditListingPage"));
const LeadsManagementPage = lazy(() => import("@/features/agent-dashboard/LeadsManagementPage"));
const AnalyticsDashboardPage = lazy(() => import("@/features/agent-dashboard/AnalyticsDashboardPage"));
const TeamManagementPage = lazy(() => import("@/features/agent-dashboard/TeamManagementPage"));
const NotFoundPage = lazy(() => import("@/features/public/NotFoundPage"));

function Fallback() {
  return (
    <motion.div {...pageTransition} className="app-container flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
    </motion.div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/search"
            element={
              <SearchLayout>
                <SearchPage />
              </SearchLayout>
            }
          />
          <Route
            path="/properties/:id"
            element={
              <PublicLayout>
                <PropertyDetailPage />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <LoginPage />
              </PublicLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicLayout>
                <ForgotPasswordPage />
              </PublicLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboardPage />} />
            <Route path="saved" element={<SavedListingsPage />} />
            <Route path="searches" element={<SavedSearchesPage />} />
            <Route path="alerts" element={<PropertyAlertsPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="security" element={<AccountSecurityPage />} />
          </Route>
          <Route
            path="/agent"
            element={
              <ProtectedRoute>
                <AgentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AgentOverviewPage />} />
            <Route path="listings" element={<ListingsManagementPage />} />
            <Route path="listings/new" element={<AddListingPage />} />
            <Route path="listings/:id/edit" element={<EditListingPage />} />
            <Route path="leads" element={<LeadsManagementPage />} />
            <Route path="analytics" element={<AnalyticsDashboardPage />} />
            <Route
              path="team"
              element={
                <ProtectedRoute>
                  <TeamManagementPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
