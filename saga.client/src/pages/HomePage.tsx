import { Container, Title, Grid, Card, Image, Text, Badge, Group, Stack, Loader, Center, Button, Flex, Skeleton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { usePopularContent, useTopRatedContent, useRecentContent, useRecommendedContent } from '../hooks/useIcerikler';
import { IconStar, IconArrowRight } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { ContentCardSkeleton } from '../components/ContentCardSkeleton';
import { EmptyState } from '../components/EmptyState';

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
          src={icerik.posterUrl || 'https://via.placeholder.com/300x450?text=No+Image'}
          height={300}
          alt={icerik.baslik}
          fallbackSrc="https://via.placeholder.com/300x450?text=No+Image"
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
  error 
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

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: popularContent, isLoading: popularLoading, error: popularError } = usePopularContent();
  const { data: topRatedContent, isLoading: topRatedLoading, error: topRatedError } = useTopRatedContent();
  const { data: recentContent, isLoading: recentLoading, error: recentError } = useRecentContent();
  const { data: recommendedContent, isLoading: recommendedLoading, error: recommendedError } = useRecommendedContent();

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Ana Sayfa</Title>

        {/* Önerilen İçerikler (Sadece giriş yapılmışsa) */}
        {user && (
          <ContentSection
            title="Sizin İçin Önerilen"
            data={recommendedContent}
            isLoading={recommendedLoading}
            error={recommendedError}
          />
        )}

        {/* Popüler İçerikler */}
        <ContentSection
          title="Popüler İçerikler"
          data={popularContent}
          isLoading={popularLoading}
          error={popularError}
        />

        {/* En Yüksek Puanlılar */}
        <ContentSection
          title="En Yüksek Puanlılar"
          data={topRatedContent}
          isLoading={topRatedLoading}
          error={topRatedError}
        />

        {/* Yeni İçerikler */}
        <ContentSection
          title="Yeni Eklenenler"
          data={recentContent}
          isLoading={recentLoading}
          error={recentError}
        />
      </Stack>
    </Container>
  );
}