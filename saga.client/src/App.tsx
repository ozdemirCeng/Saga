import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout
import AppLayout from './layout/AppLayout';

// Pages
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContentDetailPage from './pages/ContentDetailPage';
import ProfilePage from './pages/ProfilePage';

function App() {
    return (
        <MantineProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Toaster position="top-right" />
                    <Routes>
                        {/* Public Routes (Layoutsuz - Giriş/Kayıt Ekranları) */}
                        <Route path="/giris" element={<LoginPage />} />
                        <Route path="/kayit" element={<RegisterPage />} />

                        {/* Protected/App Routes (Layoutlu - Ana Uygulama) */}
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/kesfet" element={<ExplorePage />} />
                            <Route path="/icerik/:id" element={<ContentDetailPage />} />
                            <Route path="/profil/:username" element={<ProfilePage />} />
                        </Route>

                        {/* 404 - Tanımsız sayfa gelirse ana sayfaya at */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </MantineProvider>
    );
}

export default App;