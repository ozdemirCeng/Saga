import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  Group,
  Avatar,
  Text,
  Button,
  Stack,
  Tabs,
  Grid,
  Card,
  Image,
  Badge,
  Loader,
  Center,
  Modal,
  TextInput,
  Textarea,
} from '@mantine/core';
import {
  IconUserCircle,
  IconStar,
  IconList,
  IconActivity,
  IconEdit,
  IconCheck,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kullaniciService } from '../services/kullaniciService';
import { kutuphaneService } from '../services/kutuphaneService';
import { listeService, type ListeListDto } from '../services/listeService';
import { aktiviteService, type AktiviteDto } from '../services/aktiviteService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { EmptyState } from '../components/EmptyState';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    goruntulemeAdi: '',
    biyografi: '',
    avatarUrl: '',
  });

  // Kendi profilim mi?
  const isOwnProfile = !username || username === user?.user_metadata?.kullanici_adi;

  // Profil verisini getir
  const { data: profil, isLoading: profilLoading } = useQuery({
    queryKey: ['profil', username || 'me'],
    queryFn: () =>
      isOwnProfile
        ? kullaniciService.getMyProfile()
        : kullaniciService.getProfileByUsername(username!),
    enabled: !!user,
  });

  // Kütüphane istatistikleri
  const { data: kutuphaneStats } = useQuery({
    queryKey: ['kutuphane-stats', profil?.id],
    queryFn: () =>
      isOwnProfile
        ? kutuphaneService.getMyStats()
        : kutuphaneService.getUserStats(profil!.id),
    enabled: !!profil?.id,
  });

  // Listeler
  const { data: listeler = [] } = useQuery<ListeListDto[]>({
    queryKey: ['listeler', profil?.id],
    queryFn: () =>
      isOwnProfile
        ? listeService.getMyLists()
        : listeService.getUserLists(profil!.id),
    enabled: !!profil?.id,
  });

  // Aktiviteler
  const { data: aktiviteler = [] } = useQuery<AktiviteDto[]>({
    queryKey: ['aktiviteler', profil?.id],
    queryFn: () =>
      isOwnProfile
        ? aktiviteService.getMyActivities()
        : aktiviteService.getUserActivities(profil!.id),
    enabled: !!profil?.id,
  });

  // Takip et/Bırak mutation
  const followMutation = useMutation({
    mutationFn: (kullaniciId: string) =>
      profil?.takipEdiyorMu
        ? kullaniciService.unfollow(kullaniciId)
        : kullaniciService.follow(kullaniciId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil'] });
      notifications.show({
        title: 'Başarılı',
        message: profil?.takipEdiyorMu ? 'Takipten çıkıldı' : 'Takip edildi',
        color: 'green',
      });
    },
  });

  // Profil güncelleme mutation
  const updateMutation = useMutation({
    mutationFn: kullaniciService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil'] });
      setEditModalOpen(false);
      notifications.show({
        title: 'Başarılı',
        message: 'Profil güncellendi',
        color: 'green',
      });
    },
  });

  const handleEditOpen = () => {
    if (profil) {
      setEditForm({
        goruntulemeAdi: profil.goruntulemeAdi || '',
        biyografi: profil.biyografi || '',
        avatarUrl: profil.avatarUrl || '',
      });
      setEditModalOpen(true);
    }
  };

  if (!user) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={<IconUserCircle size={64} stroke={1.5} color="gray" />}
          title="Giriş Gerekli"
          description="Profili görüntülemek için giriş yapmalısınız"
          action={<Button onClick={() => navigate('/giris')}>Giriş Yap</Button>}
        />
      </Container>
    );
  }

  if (profilLoading) {
    return <LoadingOverlay message="Profil yükleniyor..." />;
  }

  if (!profil) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={<IconUserCircle size={64} stroke={1.5} color="gray" />}
          title="Kullanıcı Bulunamadı"
          description="Aradığınız kullanıcı bulunamadı"
          action={<Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>}
        />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Profil Başlık */}
        <Paper withBorder p="xl">
          <Group align="flex-start">
            <Avatar
              src={profil.avatarUrl}
              size={120}
              radius="md"
            >
              <IconUserCircle size={80} />
            </Avatar>

            <Stack gap="xs" style={{ flex: 1 }}>
              <Group justify="space-between">
                <div>
                  <Title order={2}>{profil.goruntulemeAdi || profil.kullaniciAdi}</Title>
                  <Text c="dimmed">@{profil.kullaniciAdi}</Text>
                </div>

                {isOwnProfile ? (
                  <Button leftSection={<IconEdit size={16} />} onClick={handleEditOpen}>
                    Profili Düzenle
                  </Button>
                ) : (
                  <Button
                    variant={profil.takipEdiyorMu ? 'outline' : 'filled'}
                    onClick={() => followMutation.mutate(profil.id)}
                    loading={followMutation.isPending}
                  >
                    {profil.takipEdiyorMu ? 'Takipten Çık' : 'Takip Et'}
                  </Button>
                )}
              </Group>

              {profil.biyografi && (
                <Text size="sm">{profil.biyografi}</Text>
              )}

              <Group gap="xl">
                <div>
                  <Text fw={700} size="lg">{profil.toplamPuanlama}</Text>
                  <Text size="sm" c="dimmed">Puanlama</Text>
                </div>
                <div>
                  <Text fw={700} size="lg">{profil.toplamYorum}</Text>
                  <Text size="sm" c="dimmed">Yorum</Text>
                </div>
                <div>
                  <Text fw={700} size="lg">{profil.toplamListe}</Text>
                  <Text size="sm" c="dimmed">Liste</Text>
                </div>
                <div>
                  <Text fw={700} size="lg">{profil.takipEdenSayisi}</Text>
                  <Text size="sm" c="dimmed">Takipçi</Text>
                </div>
                <div>
                  <Text fw={700} size="lg">{profil.takipEdilenSayisi}</Text>
                  <Text size="sm" c="dimmed">Takip</Text>
                </div>
              </Group>
            </Stack>
          </Group>
        </Paper>

        {/* Kütüphane İstatistikleri */}
        {kutuphaneStats && (
          <Paper withBorder p="lg">
            <Title order={3} mb="md">Kütüphane İstatistikleri</Title>
            <Grid>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack gap={4}>
                  <Text size="xl" fw={700}>{kutuphaneStats.izlenenFilm}</Text>
                  <Text size="sm" c="dimmed">İzlenen Film</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack gap={4}>
                  <Text size="xl" fw={700}>{kutuphaneStats.okunanKitap}</Text>
                  <Text size="sm" c="dimmed">Okunan Kitap</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack gap={4}>
                  <Text size="xl" fw={700}>{kutuphaneStats.toplamFilm}</Text>
                  <Text size="sm" c="dimmed">Toplam Film</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack gap={4}>
                  <Text size="xl" fw={700}>{kutuphaneStats.toplamKitap}</Text>
                  <Text size="sm" c="dimmed">Toplam Kitap</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        )}

        {/* Tabs */}
        <Tabs defaultValue="listeler">
          <Tabs.List>
            <Tabs.Tab value="listeler" leftSection={<IconList size={16} />}>
              Listeler ({listeler.length})
            </Tabs.Tab>
            <Tabs.Tab value="aktiviteler" leftSection={<IconActivity size={16} />}>
              Aktiviteler ({aktiviteler.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="listeler" pt="lg">
            {listeler.length > 0 ? (
              <Grid>
                {listeler.map((liste) => (
                  <Grid.Col key={liste.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card
                      withBorder
                      padding="lg"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/liste/${liste.id}`)}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={600}>{liste.ad}</Text>
                          <Badge>{liste.icerikSayisi} içerik</Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          {liste.herkeseAcik ? 'Herkese Açık' : 'Özel'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(liste.olusturulmaZamani).toLocaleDateString('tr-TR')}
                        </Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <EmptyState
                icon={<IconList size={48} stroke={1.5} color="gray" />}
                title="Liste Yok"
                description="Henüz liste oluşturulmamış"
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="aktiviteler" pt="lg">
            {aktiviteler.length > 0 ? (
              <Stack gap="md">
                {aktiviteler.map((aktivite) => (
                  <Paper key={aktivite.id} withBorder p="md">
                    <Group>
                      {aktivite.posterUrl && (
                        <Image
                          src={aktivite.posterUrl}
                          width={60}
                          height={90}
                          radius="sm"
                          fallbackSrc="https://via.placeholder.com/60x90"
                        />
                      )}
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Badge>{aktivite.aktiviteTuru}</Badge>
                          <Text size="sm" c="dimmed">
                            {new Date(aktivite.olusturulmaZamani).toLocaleDateString('tr-TR')}
                          </Text>
                        </Group>
                        <Text fw={500}>{aktivite.icerikBaslik}</Text>
                        {aktivite.puan && (
                          <Group gap={4}>
                            <IconStar size={14} fill="gold" color="gold" />
                            <Text size="sm">{aktivite.puan.toFixed(1)}</Text>
                          </Group>
                        )}
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <EmptyState
                icon={<IconActivity size={48} stroke={1.5} color="gray" />}
                title="Aktivite Yok"
                description="Henüz aktivite bulunmuyor"
              />
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Düzenleme Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Profili Düzenle"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Görüntüleme Adı"
            placeholder="İsminiz"
            value={editForm.goruntulemeAdi}
            onChange={(e) => setEditForm({ ...editForm, goruntulemeAdi: e.target.value })}
          />
          <Textarea
            label="Biyografi"
            placeholder="Kendiniz hakkında birkaç kelime..."
            value={editForm.biyografi}
            onChange={(e) => setEditForm({ ...editForm, biyografi: e.target.value })}
            minRows={3}
          />
          <TextInput
            label="Avatar URL"
            placeholder="https://..."
            value={editForm.avatarUrl}
            onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setEditModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => updateMutation.mutate(editForm)}
              loading={updateMutation.isPending}
              leftSection={<IconCheck size={16} />}
            >
              Kaydet
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}