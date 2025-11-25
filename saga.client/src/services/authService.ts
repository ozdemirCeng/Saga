import { supabase } from './supabase';
// DÜZELTME BURADA: 'type' kelimesini ekledik
import type { RegisterDto, LoginDto } from '../types/auth';

export const authService = {
    // Kayıt Ol
    register: async (data: RegisterDto) => {
        return await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    username: data.username,
                    full_name: data.fullName
                }
            }
        });
    },

    // Giriş Yap
    login: async (data: LoginDto) => {
        return await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });
    },

    // Çıkış Yap
    logout: async () => {
        return await supabase.auth.signOut();
    },

    // Mevcut Oturumu Getir
    getSession: async () => {
        return await supabase.auth.getSession();
    },

    // Kullanıcı Bilgisini Getir
    getUser: async () => {
        return await supabase.auth.getUser();
    }
};