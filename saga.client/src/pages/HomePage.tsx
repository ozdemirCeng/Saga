import { Container, Title, SimpleGrid, Card, Image, Text, Badge, Button, Group, Loader, Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { usePopularContent } from '../hooks/useIcerikler';

export default function HomePage() {
    // Hook'u kullanarak verileri çekiyoruz
    const { data: icerikler, isLoading, error } = usePopularContent();
    const navigate = useNavigate();

    // Yükleniyor durumu
    if (isLoading) {
        return (
            <Center h="50vh">
                <Loader size="xl" />
            </Center>
        );
    }

    // Hata durumu
    if (error) {
        return (
            <Center h="50vh">
                <Text c="red">İçerikler yüklenirken bir hata oluştu. Backend çalışıyor mu?</Text>
            </Center>
        );
    }

    return (
        <Container size="lg" py="xl">
            <Title order={2} mb="xl">🔥 Popüler İçerikler</Title>

            {icerikler?.length === 0 ? (
                <Center h={200}>
                    <Text c="dimmed">Henüz veritabanında içerik yok. (Seed işlemini çalıştırmalısın)</Text>
                </Center>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
                    {icerikler?.map((item) => (
                        <Card key={item.id} shadow="sm" padding="lg" radius="md" withBorder>
                            <Card.Section>
                                <Image
                                    src={item.posterUrl || "https://placehold.co/600x400?text=No+Image"}
                                    height={300}
                                    alt={item.baslik}
                                    fallbackSrc="https://placehold.co/600x400?text=Resim+Yok"
                                />
                            </Card.Section>

                            <Group justify="space-between" mt="md" mb="xs">
                                <Text fw={500} truncate>{item.baslik}</Text>
                                <Badge color={item.tur === 'film' ? 'blue' : 'green'}>{item.tur}</Badge>
                            </Group>

                            <Text size="sm" c="dimmed">
                                Puan: ⭐ {item.ortalamaPuan ? item.ortalamaPuan.toFixed(1) : '-'}
                            </Text>

                            <Button
                                color="blue"
                                fullWidth
                                mt="md"
                                radius="md"
                                onClick={() => navigate(`/icerik/${item.id}`)}
                            >
                                Detaylar
                            </Button>
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </Container>
    );
}