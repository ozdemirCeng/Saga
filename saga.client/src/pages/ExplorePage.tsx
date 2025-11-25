import { useState } from 'react';
import {
  Container,
  Title,
  TextInput,
  Select,
  Grid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  NumberInput,
  Loader,
  Center,
  Paper,
  Flex,
  ActionIcon,
  Collapse,
  Tabs,
} from '@mantine/core';
import { IconSearch, IconFilter, IconX, IconStar } from '@tabler/icons-react';
import { useSearchContent, useFilteredContent } from '../hooks/useIcerikler';
import { useNavigate } from 'react-router';
import { useDebouncedValue } from '@mantine/hooks';
import { ContentCardSkeleton } from '../components/ContentCardSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { externalApiService } from '../services/externalApiService';
import { notifications } from '@mantine/notifications';

const filmTurleri = [
  'Aksiyon',
  'Macera',
  'Animasyon',
  'Komedi',
  'Suç',
  'Belgesel',
  'Drama',
  'Aile',
  'Fantastik',
  'Tarih',
  'Korku',
  'Müzik',
  'Gizem',
  'Romantik',
  'Bilim Kurgu',
  'Gerilim',
  'Savaş',
  'Western',
];

const kitapKategorileri = [
  'Roman',
  'Bilim Kurgu',
  'Fantastik',
  'Polisiye',
  'Gerilim',
  'Tarih',
  'Biyografi',
  'Bilim',
  'Felsefe',
  'Psikoloji',
  'Şiir',
  'Deneme',
  'Çocuk',
  'Gençlik',
  'Kişisel Gelişim',
  'İş ve Ekonomi',
];

export default function ExplorePage() {
  const navigate = useNavigate();
  
  // Arama state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 500);
  const [activeTab, setActiveTab] = useState<'database' | 'tmdb' | 'books'>('database');

  // Filtre state
  const [showFilters, setShowFilters] = useState(false);
  const [tur, setTur] = useState<'film' | 'kitap' | undefined>(undefined);
  const [turler, setTurler] = useState<string[]>([]);
  const [minPuan, setMinPuan] = useState<number | undefined>(undefined);
  const [maxPuan, setMaxPuan] = useState<number | undefined>(undefined);
  const [minYil, setMinYil] = useState<number | undefined>(undefined);
  const [maxYil, setMaxYil] = useState<number | undefined>(undefined);

  // Arama veya filtreleme yapılıyor mu?
  const isSearching = debouncedQuery.length > 2;
  const hasFilters = tur || turler.length > 0 || minPuan || maxPuan || minYil || maxYil;

  // Query hooks - Database
  const { data: searchResults, isLoading: searchLoading } = useSearchContent(debouncedQuery, { enabled: isSearching && activeTab === 'database' });
  const { data: filterResults, isLoading: filterLoading } = useFilteredContent({
    tur,
    turler: turler.length > 0 ? turler : undefined,
    minPuan,
    maxPuan,
    minYil,
    maxYil,
    limit: 50
  }, { enabled: activeTab === 'database' });

  // Query hooks - External APIs
  const { data: tmdbResults, isLoading: tmdbLoading } = useQuery({
    queryKey: ['tmdb-search', debouncedQuery],
    queryFn: () => isSearching ? externalApiService.searchTmdbFilms(debouncedQuery) : externalApiService.getPopularTmdbFilms(),
    enabled: activeTab === 'tmdb'
  });

  const { data: booksResults, isLoading: booksLoading } = useQuery({
    queryKey: ['books-search', debouncedQuery],
    queryFn: () => externalApiService.searchGoogleBooks(debouncedQuery, 0, 40),
    enabled: activeTab === 'books' && isSearching
  });

  // Initial load for "all content" if no search/filter
  const { data: allContent, isLoading: allContentLoading } = useFilteredContent({
    limit: 50
  }, { enabled: activeTab === 'database' && !isSearching && !hasFilters });

  // Determine which results to display
  let displayResults: any[] = [];
  let isContentLoading = false;

  if (activeTab === 'database') {
    displayResults = isSearching 
      ? searchResults ?? []
      : hasFilters 
        ? filterResults ?? []
        : allContent ?? [];
    isContentLoading = isSearching ? searchLoading : hasFilters ? filterLoading : allContentLoading;
  } else if (activeTab === 'tmdb') {
    displayResults = (tmdbResults ?? []).map(film => ({
      id: film.id,
      baslik: film.baslik,
      posterUrl: film.posterUrl,
      ortalamaPuan: film.puan,
      tur: 'film' as const,
      yayinTarihi: film.yayinTarihi,
      aciklama: film.aciklama,
      isExternal: true,
      externalId: film.id
    }));
    isContentLoading = tmdbLoading;
  } else if (activeTab === 'books') {
    displayResults = (booksResults ?? []).map(book => ({
      id: book.id,
      baslik: book.baslik,
      posterUrl: book.posterUrl,
      ortalamaPuan: 0,
      tur: 'kitap' as const,
      yayinTarihi: book.yayinTarihi,
      aciklama: book.aciklama,
      isExternal: true,
      externalId: book.id
    }));
    isContentLoading = booksLoading;
  }

  const handleClearFilters = () => {
    setTur(undefined);
    setTurler([]);
    setMinPuan(undefined);
    setMaxPuan(undefined);
    setMinYil(undefined);
    setMaxYil(undefined);
  };

  const getCurrentTurler = () => {
    return tur === 'film' ? filmTurleri : tur === 'kitap' ? kitapKategorileri : [];
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Başlık */}
        <Title order={1}>Keşfet</Title>

        {/* Tabs for different sources */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
          <Tabs.List>
            <Tabs.Tab value="database">Tümü</Tabs.Tab>
            <Tabs.Tab value="tmdb">TMDB'de Ara</Tabs.Tab>
            <Tabs.Tab value="books">Kitap Ara</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Arama Kutusu */}
        <TextInput
          placeholder={
            activeTab === 'database' 
              ? "Veritabanında ara..." 
              : activeTab === 'tmdb'
                ? "TMDB'de film ara..."
                : "Google Books'ta kitap ara..."
          }
          leftSection={<IconSearch size={16} />}
          size="lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          rightSection={
            searchQuery && (
              <ActionIcon variant="subtle" onClick={() => setSearchQuery('')}>
                <IconX size={16} />
              </ActionIcon>
            )
          }
        />

        {/* Filtreler - Only for database tab */}
        {activeTab === 'database' && (
        <Paper withBorder p="md">
          <Group justify="space-between" mb={showFilters ? 'md' : 0}>
            <Button
              leftSection={<IconFilter size={16} />}
              variant="light"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtreler {hasFilters && `(${[tur, ...turler, minPuan, maxPuan, minYil, maxYil].filter(Boolean).length})`}
            </Button>
            
            {hasFilters && (
              <Button variant="subtle" color="red" onClick={handleClearFilters}>
                Filtreleri Temizle
              </Button>
            )}
          </Group>

          <Collapse in={showFilters}>
            <Grid gutter="md" mt="md">
              {/* İçerik Türü */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="İçerik Türü"
                  placeholder="Seçiniz"
                  data={[
                    { value: 'film', label: 'Film' },
                    { value: 'kitap', label: 'Kitap' },
                  ]}
                  value={tur}
                  onChange={(value) => {
                    setTur(value as 'film' | 'kitap' | undefined);
                    setTurler([]); // Tür değişince kategorileri temizle
                  }}
                  clearable
                />
              </Grid.Col>

              {/* Kategori/Tür (Film türleri veya Kitap kategorileri) */}
              {tur && (
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label={tur === 'film' ? 'Film Türü' : 'Kitap Kategorisi'}
                    placeholder="Seçiniz"
                    data={getCurrentTurler()}
                    value={turler[0] || null}
                    onChange={(value) => setTurler(value ? [value] : [])}
                    clearable
                    searchable
                  />
                </Grid.Col>
              )}

              {/* Minimum Puan */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Minimum Puan"
                  placeholder="0"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minPuan}
                  onChange={(value) => setMinPuan(value as number | undefined)}
                  allowDecimal
                />
              </Grid.Col>

              {/* Maximum Puan */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Maximum Puan"
                  placeholder="10"
                  min={0}
                  max={10}
                  step={0.5}
                  value={maxPuan}
                  onChange={(value) => setMaxPuan(value as number | undefined)}
                  allowDecimal
                />
              </Grid.Col>

              {/* Minimum Yıl */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Başlangıç Yılı"
                  placeholder="1900"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={minYil}
                  onChange={(value) => setMinYil(value as number | undefined)}
                />
              </Grid.Col>

              {/* Maximum Yıl */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Bitiş Yılı"
                  placeholder={new Date().getFullYear().toString()}
                  min={1900}
                  max={new Date().getFullYear()}
                  value={maxYil}
                  onChange={(value) => setMaxYil(value as number | undefined)}
                />
              </Grid.Col>
            </Grid>
          </Collapse>
        </Paper>
        )}

        {/* Sonuçlar */}
        {isContentLoading ? (
          <Grid>
            {[...Array(12)].map((_, index) => (
              <Grid.Col key={index} span={{ base: 12, xs: 6, sm: 4, md: 3, lg: 2 }}>
                <ContentCardSkeleton />
              </Grid.Col>
            ))}
          </Grid>
        ) : displayResults && displayResults.length > 0 ? (
          <>
            <Text c="dimmed">
              {displayResults.length} sonuç bulundu
            </Text>
            <Grid>
              {displayResults.map((icerik) => (
                <Grid.Col key={icerik.id} span={{ base: 6, xs: 6, sm: 4, md: 3, lg: 2 }}>
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
                    onClick={() => {
                      if (icerik.isExternal) {
                        notifications.show({
                          title: 'Henüz Eklenmemiş',
                          message: 'Bu içerik henüz veritabanına eklenmemiş. Önce kütüphanenize ekleyin.',
                          color: 'orange',
                        });
                      } else {
                        navigate(`/icerik/${icerik.id}`);
                      }
                    }}
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

                        {(icerik.ortalamaPuan ?? 0) > 0 && (
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
                </Grid.Col>
              ))}
            </Grid>
          </>
        ) : (isSearching || hasFilters) ? (
          <EmptyState
            icon={<IconSearch size={48} stroke={1.5} color="gray" />}
            title="Sonuç Bulunamadı"
            description={isSearching ? 'Farklı bir arama terimi deneyin' : 'Filtreleri değiştirmeyi deneyin'}
          />
        ) : (
           // Should not happen with default load, but fallback
          <EmptyState
            icon={<IconSearch size={48} stroke={1.5} color="gray" />}
            title="İçerik Bulunamadı"
            description="Henüz içerik eklenmemiş olabilir."
          />
        )}
      </Stack>
    </Container>
  );
}