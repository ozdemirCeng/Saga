import axios from 'axios';
import { supabase } from './supabase';
import toast from 'react-hot-toast';

// Backend'in çalıştığı adres
const API_URL = 'http://localhost:5054/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: İstek gönderilmeden hemen önce araya girer
api.interceptors.request.use(async (config) => {
    // 1. Supabase'den güncel oturum bilgisini al
    const { data } = await supabase.auth.getSession();

    // 2. Eğer kullanıcı giriş yapmışsa, Token'ı başlığa ekle
    if (data.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// RESPONSE INTERCEPTOR: Cevap geldikten hemen sonra araya girer
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Hata yönetimi
    const message = error.response?.data?.message || 'Bir hata oluştu.';

    // 401 (Yetkisiz) hatası gelirse konsola bas, diğerlerinde bildirim göster
    if (error.response?.status === 401) {
        console.warn("Oturum süresi dolmuş veya yetkisiz erişim.");
    } else {
        toast.error(message);
    }

    return Promise.reject(error);
});

export default api;