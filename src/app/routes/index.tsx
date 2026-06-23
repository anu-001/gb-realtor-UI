import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { motion } from "framer-motion";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { SearchLayout } from "@/app/layouts/SearchLayout";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { AgentLayout } from "@/app/layouts/AgentLayout";
import { ProtectedRoute } from "@/app/layouts/ProtectedRoute";
import { UserRole } from "@/constants/api-enums";
import { pageTransition } from "@/utils/motion";

const HomePage = lazy(() => import("@/features/home/HomePage"));
const SearchPage = lazy(() => import("@/features/search/SearchPage"));
const PropertyDetailPage = lazy(() => import("@/features/public/PropertyDetailPage"));
const RequestPropertyPage = lazy(() => import("@/features/public/RequestPropertyPage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import("@/features/auth/ForgotPasswordPage"));
const UserDashboardPage = lazy(() => import("@/features/dashboard/UserDashboardPage"));
const SavedListingsPage = lazy(() => import("@/features/dashboard/SavedListingsPage"));
const SavedSearchesPage = lazy(() => import("@/features/dashboard/SavedSearchesPage"));
const PropertyAlertsPage = lazy(() => import("@/features/dashboard/PropertyAlertsPage"));
const RecentlyViewedPage = lazy(() => import("@/features/dashboard/RecentlyViewedPage"));
const ProfileSettingsPage = lazy(() => import("@/features/dashboard/ProfileSettingsPage"));
const NotificationsPage = lazy(() => import("@/features/dashboard/NotificationsPage"));
const AccountSecurityPage = lazy(() => import("@/features/dashboard/AccountSecurityPage"));
const AgentOverviewPage = lazy(() => import("@/features/agent-dashboard/AgentOverviewPage"));
const ListingsManagementPage = lazy(() => import("@/features/agent-dashboard/ListingsManagementPage"));
const AddListingPage = lazy(() => import("@/features/agent-dashboard/AddListingPage"));
const EditListingPage = lazy(() => import("@/features/agent-dashboard/EditListingPage"));
const LeadsManagementPage = lazy(() => import("@/features/agent-dashboard/LeadsManagementPage"));
const AnalyticsDashboardPage = lazy(() => import("@/features/agent-dashboard/AnalyticsDashboardPage"));
const TeamManagementPage = lazy(() => import("@/features/agent-dashboard/TeamManagementPage"));
const AuditLogsPage = lazy(() => import("@/features/agent-dashboard/AuditLogsPage"));
const RolesPermissionsPage = lazy(() => import("@/features/agent-dashboard/RolesPermissionsPage"));
const FeaturedPropertiesPage = lazy(() => import("@/features/agent-dashboard/FeaturedPropertiesPage"));
const PropertyMediaPage = lazy(() => import("@/features/agent-dashboard/PropertyMediaPage"));
const NotFoundPage = lazy(() => import("@/features/public/NotFoundPage"));

function LoadingFallback() {
  return (
    <motion.div {...pageTransition} className="app-container flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
    </motion.div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "properties/:id", element: <PropertyDetailPage /> },
      { path: "request-property", element: <RequestPropertyPage /> },
    ],
  },
  {
    path: "/search",
    element: <SearchLayout />,
    children: [{ index: true, element: <SearchPage /> }],
  },
  {
    path: "/login",
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: "/forgot-password",
    element: <AuthLayout />,
    children: [{ index: true, element: <ForgotPasswordPage /> }],
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <UserDashboardPage /> },
      { path: "saved", element: <SavedListingsPage /> },
      { path: "searches", element: <SavedSearchesPage /> },
      { path: "alerts", element: <PropertyAlertsPage /> },
      { path: "recently-viewed", element: <RecentlyViewedPage /> },
      { path: "profile", element: <ProfileSettingsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "security", element: <AccountSecurityPage /> },
    ],
  },
  {
    path: "/agent",
    element: (
      <ProtectedRoute>
        <AgentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AgentOverviewPage /> },
      { path: "listings", element: <ListingsManagementPage /> },
      {
        path: "listings/new",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.PropertyManager, UserRole.SuperAdmin]}>
            <AddListingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "listings/:id/edit",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.PropertyManager, UserRole.ContentEditor, UserRole.SuperAdmin]}>
            <EditListingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "leads",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.PropertyManager, UserRole.SupportAgent, UserRole.Analyst, UserRole.SuperAdmin]}>
            <LeadsManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.Analyst, UserRole.SuperAdmin]}>
            <AnalyticsDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "featured-properties",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.PropertyManager, UserRole.ContentEditor, UserRole.SuperAdmin]}>
            <FeaturedPropertiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "property-media",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.PropertyManager, UserRole.ContentEditor, UserRole.SuperAdmin]}>
            <PropertyMediaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute requiredRole="SuperAdmin">
            <TeamManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "roles-permissions",
        element: (
          <ProtectedRoute requiredRole="SuperAdmin">
            <RolesPermissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <ProtectedRoute requiredRole="SuperAdmin">
            <AuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "team",
        element: (
          <ProtectedRoute requiredRole="SuperAdmin">
            <TeamManagementPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
