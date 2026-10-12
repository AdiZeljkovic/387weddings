import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/admin/ProtectedRoute';
import { AdminLayout } from '../../components/admin/AdminLayout';

/**
 * The whole panel behind one lazy import, so none of it — the layout, its
 * icons, the guard — is in the bundle every visitor of the public site loads.
 */
const Dashboard = lazy(() => import('./Dashboard'));
const StoriesManager = lazy(() => import('./StoriesManager'));
const Submissions = lazy(() => import('./Submissions'));
const AdminSettings = lazy(() => import('./AdminSettings'));
const PagesManager = lazy(() => import('./PagesManager'));
const ImagesManager = lazy(() => import('./ImagesManager'));

const Loading = (
  <div className="h-screen w-full flex items-center justify-center bg-moody-950">
    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function AdminRoot() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Suspense fallback={Loading}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pages" element={<PagesManager />} />
            <Route path="/images" element={<ImagesManager />} />
            <Route path="/stories" element={<StoriesManager />} />
            <Route path="/submissions" element={<Submissions />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  );
}
