import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <--- EKLENDİ (1)

import { AuthProvider } from './context/AuthContext';
import AppLayout from './layout/AppLayout';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContentDetailPage from './pages/ContentDetailPage';
import ProfilePage from './pages/ProfilePage';

// Client örneğini oluştur (Cache ayarlarıyla)
const queryClient = new QueryClient({ // <--- EKLENDİ (2)
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // Veriler 5 dakika taze sayılsın (tekrar istek atma)
            retry: 1, // Hata olursa 1 kere daha dene
        },
    },
});

function App() {
    return (
        <MantineProvider>
            <QueryClientProvider client={queryClient}> {/* <--- EKLENDİ (3): En dışa sarmaladık */}
                <AuthProvider>
                    <BrowserRouter>
                        <Toaster position="top-right" />
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/giris" element={<LoginPage />} />
                            <Route path="/kayit" element={<RegisterPage />} />

                            {/* Protected Routes */}
                            <Route element={<AppLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/kesfet" element={<ExplorePage />} />
                                <Route path="/icerik/:id" element={<ContentDetailPage />} />
                                <Route path="/profil/:username" element={<ProfilePage />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </QueryClientProvider> {/* <--- EKLENDİ */}
        </MantineProvider>
    );
}

export default App;