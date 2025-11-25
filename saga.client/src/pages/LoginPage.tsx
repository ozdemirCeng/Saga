import { useState } from 'react';
import { TextInput, PasswordInput, Checkbox, Anchor, Paper, Title, Text, Container, Group, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
            navigate('/'); // Ana sayfaya git
        } catch (error: any) {
            toast.error(error.message || 'Giriş yapılırken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">Hoş Geldiniz! 👋</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Hesabınız yok mu?{' '}
                <Anchor size="sm" component="button" onClick={() => navigate('/kayit')}>
                    Kayıt Olun
                </Anchor>
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={handleLogin}>
                    <TextInput
                        label="E-posta"
                        placeholder="ornek@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <PasswordInput
                        label="Şifre"
                        placeholder="Şifreniz"
                        required
                        mt="md"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Group justify="space-between" mt="lg">
                        <Checkbox label="Beni hatırla" />
                        <Anchor component="button" size="sm">
                            Şifremi unuttum?
                        </Anchor>
                    </Group>

                    <Button fullWidth mt="xl" type="submit" loading={loading}>
                        Giriş Yap
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}