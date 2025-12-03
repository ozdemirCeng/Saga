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
  Tooltip,
  Spoiler,
  SimpleGrid,
  Box,
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

// HTML taglarını temizleyen yardımcı fonksiyon
function stripHtmlTags(html: string | undefined | null): string {
    if (!html) return '';
    // <br> ve </p> taglarını satır sonuna çevir (paragraf geçişleri için)
    let text = html.replace(/<br\s*\/?>/gi, '\n')
                   .replace(/<\/p>/gi, '\n');
    // Diğer HTML taglarını kaldır
    text = text.replace(/<[^>]*>/g, '');
    // HTML entities'i decode et
    text = text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&nbsp;/g, ' ');
    // Birden fazla satır sonunu tek satır sonuna çevir
    text = text.replace(/\n{3,}/g, '\n\n');
    // Satır başı/sonu boşlukları temizle
    text = text.split('\n').map(line => line.trim()).join('\n').trim();
    return text;
}

// Genişletilebilir metin komponenti
function ExpandableText({ text, maxLength = 500 }: { text: string; maxLength?: number }) {
    const [expanded, setExpanded] = useState(false);
    
    // HTML taglarını temizle
    const cleanText = stripHtmlTags(text);
    
    if (!cleanText) {
        return null;
    }
    
    // Kısa metin için direkt göster
    if (cleanText.length <= maxLength) {
        return <Text size="md" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{cleanText}</Text>;
    }
    
    // Uzun metin için genişletilebilir göster
    return (
        <Box>
            <Text size="md" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {expanded ? cleanText : `${cleanText.substring(0, maxLength)}...`}
            </Text>
            <Button
                variant="subtle"
                size="xs"
                mt="xs"
                onClick={() => setExpanded(!expanded)}
                style={{ fontWeight: 500 }}
            >
                {expanded ? '↑ Daha Az Göster' : '↓ Devamını Oku'}
            </Button>
        </Box>
    );
}

// Genişletilebilir yorum komponenti
function ExpandableComment({ text, maxLength = 200, spoiler = false }: { text: string; maxLength?: number; spoiler?: boolean }) {
    const [spoilerRevealed, setSpoilerRevealed] = useState(false);
    
    // Spoiler içeriyorsa ve henüz açılmadıysa
    if (spoiler && !spoilerRevealed) {
        return (
            <Box mt="sm" p="sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setSpoilerRevealed(true)}>
                <Text c="dimmed" size="sm" ta="center">🚨 Spoiler içerik - görmek için tıklayın</Text>
            </Box>
        );
    }
    
    if (!text || text.length <= maxLength) {
        return <Text mt="sm">{text}</Text>;
    }
    
    return (
        <Spoiler maxHeight={80} showLabel="Devamını Oku" hideLabel="Daha Az Göster">
            <Text mt="sm">{text}</Text>
        </Spoiler>
    );
}

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

    // Debug: Meta verileri konsola yazdır
    console.log('İçerik Data:', icerik);
    console.log('Yazarlar:', icerik?.yazarlar);
    console.log('Sayfa Sayısı:', icerik?.sayfaSayisi);
    console.log('Oyuncular:', icerik?.oyuncular);
    console.log('Yönetmen:', icerik?.yonetmen);

    // Kütüphane durumu
    const { data: kutuphaneDurum } = useQuery({
        queryKey: ['kutuphane-durum', numericContentId],
        queryFn: () => kutuphaneService.getByIcerik(numericContentId),
        enabled: !!user && hasValidContentId,
        retry: false, // 404 için retry yapma
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

                    {/* İkili Puan Gösterimi - Her zaman ikisi de gösterilir */}
                    <Stack gap="xs" mb="lg">
                        <Group>
                            {/* Harici Puan (TMDB/Google) */}
                            <Tooltip label={icerik.tur === 'kitap' ? 'Google Books Puanı' : 'TMDB Puanı'}>
                                <Badge size="xl" color="orange" variant="filled" style={{ padding: '12px 16px' }}>
                                    ⭐ {(icerik.hariciPuan ?? 0) > 0 ? icerik.hariciPuan.toFixed(1) : '-'} {icerik.tur === 'kitap' ? 'Google' : 'TMDB'}
                                </Badge>
                            </Tooltip>
                            {/* Platform Puanı (SAGA) */}
                            <Tooltip label="SAGA kullanıcılarının ortalama puanı">
                                <Badge size="xl" color="blue" variant="filled" style={{ padding: '12px 16px' }}>
                                    ⭐ {(icerik.ortalamaPuan ?? 0) > 0 ? icerik.ortalamaPuan.toFixed(1) : '-'} SAGA
                                    {icerik.puanlamaSayisi > 0 && (
                                        <Text span size="xs" ml={4}>({icerik.puanlamaSayisi})</Text>
                                    )}
                                </Badge>
                            </Tooltip>
                        </Group>
                        
                        {/* Meta Bilgiler */}
                        <Group gap="xs" mt="xs">
                            <Text c="dimmed" size="sm">📅 {icerik.yayinTarihi || 'Tarih bilinmiyor'}</Text>
                            
                            {/* Film/Dizi için süre veya sezon bilgisi */}
                            {icerik.tur === 'film' && icerik.sure && (
                                <Text c="dimmed" size="sm">⏱️ {icerik.sure} dk</Text>
                            )}
                            {icerik.sezonSayisi && (
                                <Text c="dimmed" size="sm">📺 {icerik.sezonSayisi} Sezon {icerik.bolumSayisi && `/ ${icerik.bolumSayisi} Bölüm`}</Text>
                            )}
                            
                            {/* Kitap için sayfa sayısı */}
                            {icerik.tur === 'kitap' && icerik.sayfaSayisi && (
                                <Text c="dimmed" size="sm">📖 {icerik.sayfaSayisi} sayfa</Text>
                            )}
                        </Group>

                        {/* Türler */}
                        {icerik.turler && icerik.turler.length > 0 && (
                            <Group gap="xs" mt="xs">
                                {icerik.turler.map((tur, index) => (
                                    <Badge key={index} variant="light" color="gray" size="sm">{tur}</Badge>
                                ))}
                            </Group>
                        )}
                        
                        {/* Kategoriler (Kitap) */}
                        {icerik.kategoriler && icerik.kategoriler.length > 0 && (
                            <Group gap="xs" mt="xs">
                                {icerik.kategoriler.map((kategori, index) => (
                                    <Badge key={index} variant="light" color="teal" size="sm">{kategori}</Badge>
                                ))}
                            </Group>
                        )}

                        {/* Yönetmen (Film/Dizi) */}
                        {icerik.yonetmen && (
                            <Text size="sm" mt="xs">
                                <Text span fw={500}>🎬 Yönetmen: </Text>
                                {icerik.yonetmen}
                            </Text>
                        )}
                        
                        {/* Yazarlar (Kitap) */}
                        {icerik.yazarlar && icerik.yazarlar.length > 0 && (
                            <Text size="sm" mt="xs">
                                <Text span fw={500}>✍️ Yazar: </Text>
                                {icerik.yazarlar.join(', ')}
                            </Text>
                        )}
                        
                        {/* Yayınevi (Kitap) */}
                        {icerik.yayinevi && (
                            <Text size="sm">
                                <Text span fw={500}>🏢 Yayınevi: </Text>
                                {icerik.yayinevi}
                            </Text>
                        )}
                        
                        {/* ISBN (Kitap) */}
                        {icerik.isbn && (
                            <Text size="sm" c="dimmed">
                                <Text span fw={500}>ISBN: </Text>
                                {icerik.isbn}
                            </Text>
                        )}
                    </Stack>

                    {/* Açıklama - Genişletilebilir */}
                    {icerik.aciklama && (
                        <Box mb="xl">
                            <Text fw={500} mb="xs">Açıklama</Text>
                            <ExpandableText text={icerik.aciklama} maxLength={600} />
                        </Box>
                    )}

                    {/* Oyuncular (Film/Dizi) */}
                    {icerik.oyuncular && icerik.oyuncular.length > 0 && (
                        <Box mb="xl">
                            <Text fw={500} mb="sm">🎭 Oyuncular</Text>
                            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
                                {icerik.oyuncular.slice(0, 10).map((oyuncu, index) => (
                                    <Paper key={index} p="xs" radius="md" withBorder>
                                        <Group gap="xs" wrap="nowrap">
                                            <Avatar 
                                                src={oyuncu.profilUrl} 
                                                alt={oyuncu.ad} 
                                                size="md" 
                                                radius="xl"
                                            />
                                            <div style={{ overflow: 'hidden' }}>
                                                <Text size="sm" fw={500} truncate>{oyuncu.ad}</Text>
                                                {oyuncu.karakter && (
                                                    <Text size="xs" c="dimmed" truncate>{oyuncu.karakter}</Text>
                                                )}
                                            </div>
                                        </Group>
                                    </Paper>
                                ))}
                            </SimpleGrid>
                        </Box>
                    )}

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
                            <ExpandableComment text={yorum.icerikOzet || yorum.icerik} spoiler={yorum.spoilerIceriyor} />

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