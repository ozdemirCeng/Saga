import { AppShell, Group, Burger, Title, Button, Menu, Avatar, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
    const [opened, { toggle }] = useDisclosure();
    const navigate = useNavigate();
    const { user, signOut } = useAuth(); // Context'ten kullanıcı bilgisini ve çıkış fonksiyonunu al

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    {/* SOL TARA: Logo ve Burger Menü */}
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Title order={3} style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                            🎬 Saga
                        </Title>
                    </Group>

                    {/* SAĞ TARAF: Menü ve Butonlar */}
                    <Group>
                        <Button variant="subtle" onClick={() => navigate('/kesfet')}>Keşfet</Button>

                        {user ? (
                            // Kullanıcı giriş yapmışsa: Profil Menüsü
                            <Menu shadow="md" width={200} position="bottom-end">
                                <Menu.Target>
                                    <Avatar
                                        src={user.user_metadata.avatar_url}
                                        alt={user.user_metadata.username}
                                        radius="xl"
                                        style={{ cursor: 'pointer' }}
                                        color="blue"
                                    >
                                        {/* Avatar yoksa ismin baş harfini göster */}
                                        {user.user_metadata.username?.[0]?.toUpperCase()}
                                    </Avatar>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>Hesabım ({user.user_metadata.username})</Menu.Label>

                                    <Menu.Item
                                        leftSection={<User style={{ width: rem(14), height: rem(14) }} />}
                                        onClick={() => navigate(`/profil/${user.user_metadata.username}`)}
                                    >
                                        Profilim
                                    </Menu.Item>

                                    <Menu.Item leftSection={<Settings style={{ width: rem(14), height: rem(14) }} />}>
                                        Ayarlar
                                    </Menu.Item>

                                    <Menu.Divider />

                                    <Menu.Item
                                        color="red"
                                        leftSection={<LogOut style={{ width: rem(14), height: rem(14) }} />}
                                        onClick={() => {
                                            signOut();
                                            navigate('/giris');
                                        }}
                                    >
                                        Çıkış Yap
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        ) : (
                            // Giriş yapmamışsa: Giriş Butonu
                            <Button variant="light" onClick={() => navigate('/giris')}>Giriş Yap</Button>
                        )}
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                {/* Buraya Sidebar linkleri gelecek */}
                <div>Sol Menü (Yakında)</div>
            </AppShell.Navbar>

            <AppShell.Main>
                {/* Sayfalar burada render olacak */}
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}