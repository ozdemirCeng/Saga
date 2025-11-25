import { useParams } from 'react-router-dom';
import { Container, Grid, Image, Title, Text, Badge, Group, Rating, Paper, Textarea, Button, Divider, Loader, Center, Avatar, Stack } from '@mantine/core';
import { useState } from 'react';
import { useContentDetail, useContentComments } from '../hooks/useIcerikler';
import { useInteractions } from '../hooks/useInteractions';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ContentDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [yorumMetni, setYorumMetni] = useState('');

    // Verileri Çek
    // id undefined gelirse 0 gönderelim ki hata patlamasın
    const contentId = Number(id) || 0;

    const { data: icerik, isLoading: loadingIcerik } = useContentDetail(id);
    const { data: yorumlar, isLoading: loadingYorumlar } = useContentComments(contentId);

    // Etkileşim Hookları
    const { rate, comment } = useInteractions();

    if (loadingIcerik) return <Center h="50vh"><Loader /></Center>;
    if (!icerik) return <Center h="50vh"><Text>İçerik bulunamadı.</Text></Center>;

    // Puan Verme İşlemi
    const handleRate = (value: number) => {
        if (!user) return toast.error("Puan vermek için giriş yapmalısınız.");
        rate.mutate({ icerikId: icerik.id, puan: value });
    };

    // Yorum Yapma İşlemi
    const handleComment = () => {
        if (!user) return toast.error("Yorum yapmak için giriş yapmalısınız.");
        if (!yorumMetni.trim()) return toast.error("Yorum boş olamaz.");

        comment.mutate({
            icerikId: icerik.id,
            icerik: yorumMetni,
            spoilerIceriyor: false
        }, {
            onSuccess: () => setYorumMetni('') // Başarılı olursa kutuyu temizle
        });
    };

    return (
        <Container size="lg" py="xl">
            {/* ÜST KISIM: FİLM DETAYLARI */}
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    {/* DÜZELTME BURADA: shadow="md" kaldırıldı, yerine Paper içine alındı */}
                    <Paper shadow="md" radius="md" style={{ overflow: 'hidden' }}>
                        <Image
                            src={icerik.posterUrl || "https://placehold.co/400x600"}
                            // radius="md" -> Paper hallettiği için buradakini kaldırdık
                        />
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Badge size="lg" color={icerik.tur === 'film' ? 'blue' : 'green'}>{icerik.tur.toUpperCase()}</Badge>
                    <Title mt="xs" mb="md">{icerik.baslik}</Title>

                    <Group mb="lg">
                        <Text size="xl" fw={700} c="yellow">⭐ {icerik.ortalamaPuan.toFixed(1)}</Text>
                        <Text c="dimmed">({icerik.yayinTarihi})</Text>
                    </Group>

                    <Text size="lg" mb="xl">{icerik.aciklama}</Text>

                    <Divider my="xl" label="Senin Puanın" labelPosition="center" />

                    <Center>
                        <Stack align="center">
                            <Rating
                                defaultValue={icerik.kullaniciPuani || 0}
                                count={10}
                                size="xl"
                                onChange={handleRate}
                            />
                            <Text size="sm" c="dimmed">Puan vermek için yıldızlara tıkla</Text>
                        </Stack>
                    </Center>
                </Grid.Col>
            </Grid>

            <Divider my={50} />

            {/* ALT KISIM: YORUMLAR */}
            <Title order={3} mb="md">💬 Yorumlar</Title>

            {/* Yorum Formu */}
            <Paper withBorder p="md" mb="xl" radius="md" bg="gray.0">
                <Textarea
                    placeholder="Bu içerik hakkında ne düşünüyorsun?"
                    minRows={3}
                    value={yorumMetni}
                    onChange={(e) => setYorumMetni(e.target.value)}
                    mb="sm"
                />
                <Group justify="flex-end">
                    <Button onClick={handleComment} loading={comment.isPending}>Gönder</Button>
                </Group>
            </Paper>

            {/* Yorum Listesi */}
            {loadingYorumlar ? <Loader /> : (
                <Stack>
                    {yorumlar?.map((yorum: any) => (
                        <Paper key={yorum.id} withBorder p="md" radius="md" shadow="xs">
                            <Group>
                                <Avatar src={yorum.kullaniciAvatar} alt={yorum.kullaniciAdi} radius="xl" />
                                <div>
                                    <Text size="sm" fw={500}>{yorum.kullaniciAdi}</Text>
                                    <Text size="xs" c="dimmed">{new Date(yorum.olusturulmaZamani).toLocaleDateString()}</Text>
                                </div>
                            </Group>
                            <Text mt="sm">{yorum.icerikOzet || yorum.icerik}</Text>
                        </Paper>
                    ))}
                    {yorumlar?.length === 0 && <Text c="dimmed" ta="center">Henüz yorum yapılmamış. İlk yorumu sen yap!</Text>}
                </Stack>
            )}
        </Container>
    );
}