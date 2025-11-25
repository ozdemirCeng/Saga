import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Image, 
  Title, 
  Text, 
  Badge, 
  Group, 
  Rating, 
  Paper, 
  Textarea, 
  Button, 
  Divider, 
  Loader, 
  Center, 
  Avatar, 
  Stack,
  Select,
  Modal,
  Checkbox,
  TextInput,
  Menu,
  ActionIcon,
} from '@mantine/core';
import { useState } from 'react';
import { 
  IconBookmark, 
  IconPlus, 
  IconCheck,
  IconX,
  IconTrash,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
    IconSearch,
} from '@tabler/icons-react';
import { useContentDetail, useContentComments } from '../hooks/useIcerikler';
import { useInteractions } from '../hooks/useInteractions';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kutuphaneService } from '../services/kutuphaneService';
import { listeService, type ListeListDto } from '../services/listeService';
import { notifications } from '@mantine/notifications';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { EmptyState } from '../components/EmptyState';

export default function ContentDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [yorumBaslik, setYorumBaslik] = useState('');
    const [yorumMetni, setYorumMetni] = useState('');
    const [spoilerVar, setSpoilerVar] = useState(false);

    // Kütüphane durumu için
    const [kutuphaneModalOpen, setKutuphaneModalOpen] = useState(false);
    const [kutuphaneStatus, setKutuphaneStatus] = useState<string>('');

    const rawContentId = Number(id);
    const hasValidContentId = Number.isInteger(rawContentId) && rawContentId > 0;
    const contentId = hasValidContentId ? rawContentId : null;
    const numericContentId = contentId ?? 0;

    const { data: icerik, isLoading: loadingIcerik } = useContentDetail(contentId);
    const { data: yorumlar, isLoading: loadingYorumlar } = useContentComments(contentId);

    // Kütüphane durumu
    const { data: kutuphaneDurum } = useQuery({
        queryKey: ['kutuphane-durum', numericContentId],
        queryFn: () => kutuphaneService.getByIcerik(numericContentId),
        enabled: !!user && hasValidContentId,
    });

    // Kullanıcının listeleri
    const { data: kullaniciListeleri = [] } = useQuery<ListeListDto[]>({
        queryKey: ['my-lists'],
        queryFn: () => listeService.getMyLists(),
        enabled: !!user,
    });

    // İçeriğin bulunduğu listeler
    const { data: icerikListeleri } = useQuery({
        queryKey: ['content-lists', numericContentId],
        queryFn: () => listeService.getContentLists(numericContentId),
        enabled: !!user && hasValidContentId,
    });

    // Etkileşim Hookları
    const { rate, comment, deleteComment, likeComment } = useInteractions();

    // Kütüphane ekleme/güncelleme
    const kutuphaneMutation = useMutation({
        mutationFn: (durum: string) =>
            kutuphaneService.createOrUpdate({
                icerikId: numericContentId,
                durum: durum as any,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kutuphane-durum', numericContentId] });
            setKutuphaneModalOpen(false);
            if (hasValidContentId) {
                notifications.show({
                    title: 'Başarılı',
                    message: 'Kütüphane durumu güncellendi',
                    color: 'green',
                });
            }
        },
    });

    // Listeye ekleme
    const listeEkleMutation = useMutation({
        mutationFn: (listeId: number) =>
            listeService.addContent(listeId, { icerikId: numericContentId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content-lists', numericContentId] });
            notifications.show({
                title: 'Başarılı',
                message: 'İçerik listeye eklendi',
                color: 'green',
            });
        },
    });

    if (loadingIcerik) return <LoadingOverlay message="İçerik yükleniyor..." />;
    if (!hasValidContentId) {
        return (
            <Container size="lg" py="xl">
                <EmptyState
                    icon={<IconSearch size={48} stroke={1.5} color="gray" />}
                    title="İçerik Kütüphanede Bulunmuyor"
                    description="Bu içerik henüz Saga kütüphanesine eklenmedi. Keşfet sayfasından eklemeyi deneyebilirsin."
                    action={<Button onClick={() => navigate('/explore')}>Keşfet'e Dön</Button>}
                />
            </Container>
        );
    }
    if (!icerik) {
        return (
            <Container size="lg" py="xl">
                <EmptyState
                    icon={<IconX size={48} stroke={1.5} color="red" />}
                    title="İçerik Bulunamadı"
                    description="Aradığınız içerik bulunamadı veya kaldırılmış olabilir."
                    action={<Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>}
                />
            </Container>
        );
    }

    const durumSecenekleri = icerik.tur === 'film' 
        ? [
            { value: 'izlendi', label: 'İzlendi' },
            { value: 'izlenecek', label: 'İzlenecek' },
            { value: 'devam_ediyor', label: 'İzleniyor' },
          ]
        : [
            { value: 'okundu', label: 'Okundu' },
            { value: 'okunacak', label: 'Okunacak' },
            { value: 'devam_ediyor', label: 'Okunuyor' },
          ];

    // Puan Verme İşlemi
    const handleRate = (value: number) => {
        if (!user) {
            notifications.show({
                title: 'Hata',
                message: 'Puan vermek için giriş yapmalısınız',
                color: 'red',
            });
            return;
        }
        rate.mutate({ icerikId: icerik.id, puan: value });
    };

    // Yorum Yapma İşlemi
    const handleComment = () => {
        if (!user) {
            notifications.show({
                title: 'Hata',
                message: 'Yorum yapmak için giriş yapmalısınız',
                color: 'red',
            });
            return;
        }
        if (!yorumMetni.trim()) {
            notifications.show({
                title: 'Hata',
                message: 'Yorum boş olamaz',
                color: 'red',
            });
            return;
        }

        comment.mutate({
            icerikId: icerik.id,
            baslik: yorumBaslik,
            icerik: yorumMetni,
            spoilerIceriyor: spoilerVar,
        }, {
            onSuccess: () => {
                setYorumBaslik('');
                setYorumMetni('');
                setSpoilerVar(false);
            }
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

                    {/* Kütüphane ve Liste Butonları */}
                    {user && (
                        <Group mb="lg">
                            <Button
                                leftSection={
                                    kutuphaneDurum ? <IconCheck size={16} /> : <IconBookmark size={16} />
                                }
                                variant={kutuphaneDurum ? 'filled' : 'light'}
                                onClick={() => setKutuphaneModalOpen(true)}
                            >
                                {kutuphaneDurum 
                                    ? `Kütüphanede (${kutuphaneDurum.durum})`
                                    : 'Kütüphaneye Ekle'}
                            </Button>

                            <Menu shadow="md" width={200}>
                                <Menu.Target>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        variant="light"
                                    >
                                        Listeye Ekle
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    {kullaniciListeleri.length > 0 ? (
                                        kullaniciListeleri.map((liste) => {
                                            const listedeVar = icerikListeleri?.some(l => l.id === liste.id);
                                            return (
                                                <Menu.Item
                                                    key={liste.id}
                                                    onClick={() => {
                                                        if (!listedeVar) {
                                                            listeEkleMutation.mutate(liste.id);
                                                        }
                                                    }}
                                                    disabled={listedeVar}
                                                    rightSection={listedeVar ? <IconCheck size={14} /> : null}
                                                >
                                                    {liste.ad}
                                                </Menu.Item>
                                            );
                                        })
                                    ) : (
                                        <Menu.Item disabled>Liste yok</Menu.Item>
                                    )}
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    )}

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
                <TextInput
                    placeholder="Yorum başlığı (isteğe bağlı)"
                    value={yorumBaslik}
                    onChange={(e) => setYorumBaslik(e.target.value)}
                    mb="sm"
                />
                <Textarea
                    placeholder="Bu içerik hakkında ne düşünüyorsun?"
                    minRows={3}
                    value={yorumMetni}
                    onChange={(e) => setYorumMetni(e.target.value)}
                    mb="sm"
                />
                <Group justify="space-between">
                    <Checkbox
                        label="Bu yorum spoiler içeriyor"
                        checked={spoilerVar}
                        onChange={(e) => setSpoilerVar(e.target.checked)}
                    />
                    <Button onClick={handleComment} loading={comment.isPending}>Gönder</Button>
                </Group>
            </Paper>

            {/* Yorum Listesi */}
            {loadingYorumlar ? <Loader /> : (
                <Stack>
                    {yorumlar?.map((yorum: any) => (
                        <Paper key={yorum.id} withBorder p="md" radius="md" shadow="xs" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                            <Group justify="space-between" mb="sm">
                                <Group>
                                    <Avatar src={yorum.kullaniciAvatar} alt={yorum.kullaniciAdi} radius="xl" />
                                    <div>
                                        <Text size="sm" fw={500}>{yorum.kullaniciAdi}</Text>
                                        <Text size="xs" c="dimmed">{new Date(yorum.olusturulmaZamani).toLocaleDateString()}</Text>
                                    </div>
                                </Group>
                                <Group>
                                    {yorum.spoilerIceriyor && (
                                        <Badge color="red" variant="light">SPOILER</Badge>
                                    )}
                                    {user && user.id === yorum.kullaniciId && (
                                        <ActionIcon 
                                            color="red" 
                                            variant="subtle" 
                                            onClick={() => {
                                                if (window.confirm('Yorumu silmek istediğinize emin misiniz?')) {
                                                    deleteComment.mutate(yorum.id);
                                                }
                                            }}
                                            loading={deleteComment.isPending}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    )}
                                </Group>
                            </Group>
                            {yorum.baslik && (
                                <Text fw={600} mb="xs">{yorum.baslik}</Text>
                            )}
                            <Text mt="sm">{yorum.icerikOzet || yorum.icerik}</Text>

                            <Group mt="md" gap="xs">
                                <Button 
                                    variant="subtle" 
                                    size="xs" 
                                    color={yorum.kullaniciBegendiMi ? 'red' : 'gray'}
                                    leftSection={yorum.kullaniciBegendiMi ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                                    onClick={() => likeComment.mutate(yorum.id)}
                                >
                                    {yorum.begeniSayisi} Beğeni
                                </Button>
                                
                                <Button 
                                    variant="subtle" 
                                    size="xs" 
                                    color="gray"
                                    leftSection={<IconMessageCircle size={16} />}
                                    onClick={() => notifications.show({ title: 'Yakında', message: 'Yanıtla özelliği yakında eklenecek!', color: 'blue' })}
                                >
                                    Yanıtla
                                </Button>
                            </Group>
                        </Paper>
                    ))}
                    {yorumlar?.length === 0 && <Text c="dimmed" ta="center">Henüz yorum yapılmamış. İlk yorumu sen yap!</Text>}
                </Stack>
            )}

            {/* Kütüphane Modal */}
            <Modal
                opened={kutuphaneModalOpen}
                onClose={() => setKutuphaneModalOpen(false)}
                title="Kütüphane Durumu"
            >
                <Stack gap="md">
                    <Select
                        label="Durum"
                        placeholder="Durum seçin"
                        data={durumSecenekleri}
                        value={kutuphaneStatus || kutuphaneDurum?.durum}
                        onChange={(value) => setKutuphaneStatus(value || '')}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setKutuphaneModalOpen(false)}>
                            İptal
                        </Button>
                        <Button
                            onClick={() => kutuphaneMutation.mutate(kutuphaneStatus || kutuphaneDurum?.durum || durumSecenekleri[0].value)}
                            loading={kutuphaneMutation.isPending}
                        >
                            Kaydet
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}