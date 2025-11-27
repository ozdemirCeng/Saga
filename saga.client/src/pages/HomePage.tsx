import {
  Container,
  Title,
  Grid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Flex,
  Tabs,
  Loader,
  Center,
  Box,
  Alert,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { usePopularContent, useTopRatedContent, useRecentContent, useRecommendedContent } from '../hooks/useIcerikler';
import { IconStar, IconArrowRight, IconHome, IconCompass, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { ContentCardSkeleton } from '../components/ContentCardSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ActivityCard } from '../components/ActivityCard';
import { useInfiniteQuery } from '@tanstack/react-query';
import { aktiviteService } from '../services/aktiviteService';
import type { AktiviteFeedDto } from '../services/aktiviteService';
import { useState, useRef, useEffect } from 'react';

function ContentCard({ icerik }: { icerik: any }) {
  const navigate = useNavigate();

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
      onClick={() => navigate(`/icerik/${icerik.id}`)}
    >
      <Card.Section>
        <Image
          src={icerik.posterUrl || 'https://placehold.co/300x450/e2e8f0/64748b?text=No+Image'}
          height={300}
          alt={icerik.baslik}
          fallbackSrc="https://placehold.co/300x450/e2e8f0/64748b?text=No+Image"
        />
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Text fw={500} lineClamp={2} size="sm">
          {icerik.baslik}
        </Text>

        <Flex justify="space-between" align="center">
          <Badge color={icerik.tur === 'film' ? 'blue' : 'green'} variant="light">
            {icerik.tur === 'film' ? 'Film' : 'Kitap'}
          </Badge>

          {icerik.ortalamaPuan > 0 && (
            <Group gap={4}>
              <IconStar size={14} fill="gold" color="gold" />
              <Text size="xs" fw={500}>
                {icerik.ortalamaPuan.toFixed(1)}
              </Text>
            </Group>
          )}
        </Flex>

        {icerik.yayinTarihi && (
          <Text size="xs" c="dimmed">
            {new Date(icerik.yayinTarihi).getFullYear()}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

function ContentSection({
  title,
  data,
  isLoading,
  error,
}: {
  title: string;
  data: any[] | undefined;
  isLoading: boolean;
  error: any;
}) {
  const navigate = useNavigate();

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{title}</Title>
        {!isLoading && !error && data && data.length > 0 && (
          <Button
            variant="subtle"
            rightSection={<IconArrowRight size={16} />}
            onClick={() => navigate('/kesfet')}
          >
            Tümünü Gör
          </Button>
        )}
      </Group>

      {isLoading ? (
        <Grid>
          {[...Array(6)].map((_, index) => (
            <Grid.Col key={index} span={{ base: 6, xs: 6, sm: 4, md: 3, lg: 2 }}>
              <ContentCardSkeleton />
            </Grid.Col>
          ))}
        </Grid>
      ) : error ? (
        <EmptyState
          icon={<IconStar size={48} stroke={1.5} color="gray" />}
          title="Yükleme Hatası"
          description="İçerikler yüklenirken bir hata oluştu."
          action={<Button onClick={() => window.location.reload()}>Yeniden Dene</Button>}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<IconStar size={48} stroke={1.5} color="gray" />}
          title="İçerik Bulunamadı"
          description="Henüz bu kategoride içerik bulunmuyor."
        />
      ) : (
        <Grid>
          {data.slice(0, 6).map((icerik) => (
            <Grid.Col key={icerik.id} span={{ base: 6, xs: 6, sm: 4, md: 3, lg: 2 }}>
              <ContentCard icerik={icerik} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

// Aktivite Feed Bileşeni
function ActivityFeed() {
  const { user } = useAuth();
  const limit = 15;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Takip edilen kullanıcıların aktiviteleri (giriş yapılmışsa)
  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['aktivite', 'feed', user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await aktiviteService.getFeed({ page: pageParam, limit });
      return response;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < limit) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    enabled: !!user,
    staleTime: 30000, // 30 saniye cache
  });

  // Infinite scroll için Intersection Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allActivities = feedData?.pages.flat() || [];

  if (!user) {
    return (
      <EmptyState
        icon={<IconHome size={48} stroke={1.5} color="gray" />}
        title="Giriş Yapın"
        description="Aktivite akışını görmek için giriş yapın ve kullanıcıları takip edin."
      />
    );
  }

  if (feedLoading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Aktiviteler yükleniyor...</Text>
        </Stack>
      </Center>
    );
  }

  if (feedError) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Hata" color="red">
        Aktiviteler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
      </Alert>
    );
  }

  if (!allActivities || allActivities.length === 0) {
    return (
      <EmptyState
        icon={<IconHome size={48} stroke={1.5} color="gray" />}
        title="Henüz Aktivite Yok"
        description="Takip ettiğiniz kullanıcıların aktiviteleri burada görünecek. Keşfet sayfasından kullanıcıları takip etmeye başlayın!"
      />
    );
  }

  return (
    <Stack gap="md">
      {allActivities.map((aktivite: AktiviteFeedDto) => (
        <ActivityCard
          key={aktivite.id}
          aktivite={aktivite as any}
          isLoggedIn={true}
        />
      ))}

      {/* Infinite Scroll için trigger elementi */}
      {hasNextPage && (
        <div ref={loadMoreRef}>
          {isFetchingNextPage ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : (
            <Center py="md">
              <Button variant="subtle" onClick={() => fetchNextPage()}>
                Daha Fazla Yükle
              </Button>
            </Center>
          )}
        </div>
      )}
    </Stack>
  );
}

// Keşfet Bölümü (Giriş yapmamış kullanıcılar için)
function DiscoverSection() {
  const { data: popularContent, isLoading: popularLoading, error: popularError } = usePopularContent();
  const { data: topRatedContent, isLoading: topRatedLoading, error: topRatedError } = useTopRatedContent();
  const { data: recentContent, isLoading: recentLoading, error: recentError } = useRecentContent();

  return (
    <Stack gap="xl">
      <ContentSection
        title="Popüler İçerikler"
        data={popularContent}
        isLoading={popularLoading}
        error={popularError}
      />
      <ContentSection
        title="En Yüksek Puanlılar"
        data={topRatedContent}
        isLoading={topRatedLoading}
        error={topRatedError}
      />
      <ContentSection
        title="Yeni Eklenenler"
        data={recentContent}
        isLoading={recentLoading}
        error={recentError}
      />
    </Stack>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>(user ? 'feed' : 'discover');

  // Kullanıcı giriş durumu değişince tab'ı güncelle
  useEffect(() => {
    if (user && activeTab === 'discover') {
      setActiveTab('feed');
    } else if (!user && activeTab === 'feed') {
      setActiveTab('discover');
    }
  }, [user, activeTab]);

  const { data: recommendedContent, isLoading: recommendedLoading, error: recommendedError } = useRecommendedContent();

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>
          {user ? `Hoş Geldin, ${user.goruntulemeAdi || user.kullaniciAdi || 'Kullanıcı'}!` : 'Saga\'ya Hoş Geldiniz'}
        </Title>

        {user ? (
          // Giriş yapmış kullanıcı görünümü
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="lg">
              <Tabs.Tab value="feed" leftSection={<IconHome size={16} />}>
                Akış
              </Tabs.Tab>
              <Tabs.Tab value="discover" leftSection={<IconCompass size={16} />}>
                Keşfet
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="feed">
              <Stack gap="xl">
                {/* Sizin İçin Önerilen */}
                <ContentSection
                  title="Sizin İçin Önerilen"
                  data={recommendedContent}
                  isLoading={recommendedLoading}
                  error={recommendedError}
                />

                {/* Aktivite Akışı */}
                <Box>
                  <Title order={2} mb="md">
                    Takip Ettiklerinizden
                  </Title>
                  <ActivityFeed />
                </Box>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="discover">
              <DiscoverSection />
            </Tabs.Panel>
          </Tabs>
        ) : (
          // Giriş yapmamış kullanıcı görünümü
          <DiscoverSection />
        )}
      </Stack>
    </Container>
  );
}