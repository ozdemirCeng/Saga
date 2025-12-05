import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import { AuthProvider, AuthModalProvider } from "./context/AuthContext";
import { GlassLayout } from "./components/layout";
import LoginPage from "./pages/glass/LoginPage";
import RegisterPage from "./pages/glass/RegisterPage";
import ForgotPasswordPage from "./pages/glass/ForgotPasswordPage";
import ResetPasswordPage from "./pages/glass/ResetPasswordPage";
import FeedPage from "./pages/glass/FeedPage";
import ExplorePage from "./pages/glass/ExplorePage";
import DetailPage from "./pages/glass/DetailPage";
import ProfilePage from "./pages/glass/ProfilePage";
import SettingsPage from "./pages/glass/SettingsPage";
import LibraryPage from "./pages/glass/LibraryPage";
import ListsPage from "./pages/glass/ListsPage";
import ListDetailPage from "./pages/glass/ListDetailPage";
import LikesPage from "./pages/glass/LikesPage";
import SearchPage from "./pages/glass/SearchPage";
import NotificationsPage from "./pages/NotificationsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <AuthProvider>
          <BrowserRouter>
            <AuthModalProvider>
              <Routes>
                <Route path="/giris" element={<LoginPage />} />
                <Route path="/kayit" element={<RegisterPage />} />
                <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
                <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />

                <Route element={<GlassLayout />}>
                  <Route path="/" element={<FeedPage />} />
                  <Route path="/kesfet" element={<ExplorePage />} />
                  <Route path="/icerik/:tip/:id" element={<DetailPage />} />
                  <Route path="/icerik/:id" element={<DetailPage />} />
                  <Route path="/profil/:username" element={<ProfilePage />} />
                  <Route path="/ayarlar" element={<SettingsPage />} />
                  <Route path="/kutuphane" element={<LibraryPage />} />
                  <Route path="/listelerim" element={<ListsPage />} />
                  <Route path="/liste/:id" element={<ListDetailPage />} />
                  <Route path="/begeniler" element={<LikesPage />} />
                  <Route path="/bildirimler" element={<NotificationsPage />} />
                  <Route path="/ara" element={<SearchPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </AuthModalProvider>
          </BrowserRouter>
        </AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
