import { useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Center,
  Box,
  ThemeIcon,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconMail,
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Link } from "react-router";
import api from "../services/api";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      eposta: "",
    },
    validate: {
      eposta: (value) => {
        if (!value) return "E-posta adresi gereklidir";
        if (!/^\S+@\S+\.\S+$/.test(value))
          return "Geçerli bir e-posta adresi giriniz";
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", { eposta: values.eposta });
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Bir hata oluştu. Lütfen tekrar deneyin.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Container size={460} my={80}>
        <Paper withBorder shadow="md" p={40} radius="md">
          <Center mb="lg">
            <ThemeIcon size={80} radius={80} color="green" variant="light">
              <IconCheck size={50} />
            </ThemeIcon>
          </Center>

          <Title ta="center" order={2} mb="md">
            E-posta Gönderildi!
          </Title>

          <Text c="dimmed" size="sm" ta="center" mb="xl">
            Eğer <strong>{form.values.eposta}</strong> adresi sistemimizde
            kayıtlıysa, şifre sıfırlama linki içeren bir e-posta gönderdik.
          </Text>

          <Alert color="blue" variant="light" mb="lg">
            <Text size="sm">
              E-postayı birkaç dakika içinde alacaksınız. Spam klasörünüzü de
              kontrol etmeyi unutmayın.
            </Text>
          </Alert>

          <Stack gap="xs">
            <Button
              component={Link}
              to="/giris"
              fullWidth
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
            >
              Giriş Sayfasına Dön
            </Button>

            <Button
              variant="subtle"
              fullWidth
              onClick={() => {
                setIsSuccess(false);
                form.reset();
              }}
            >
              Farklı bir e-posta dene
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={460} my={80}>
      <Box mb="xl">
        <Anchor component={Link} to="/giris" c="dimmed" size="sm">
          <Group gap={5}>
            <IconArrowLeft size={14} />
            <span>Giriş sayfasına dön</span>
          </Group>
        </Anchor>
      </Box>

      <Paper withBorder shadow="md" p={40} radius="md">
        <Center mb="lg">
          <ThemeIcon size={60} radius={60} variant="light">
            <IconMail size={35} />
          </ThemeIcon>
        </Center>

        <Title ta="center" order={2}>
          Şifremi Unuttum
        </Title>

        <Text c="dimmed" size="sm" ta="center" mt="sm" mb="xl">
          E-posta adresinizi girin, size şifre sıfırlama linki gönderelim.
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            mb="md"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="E-posta Adresi"
              placeholder="ornek@email.com"
              leftSection={<IconMail size={16} />}
              required
              {...form.getInputProps("eposta")}
            />

            <Button type="submit" fullWidth loading={isLoading}>
              Sıfırlama Linki Gönder
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="xs" ta="center" mt="xl">
          Hesabınız yok mu?{" "}
          <Anchor component={Link} to="/kayit" size="xs">
            Kayıt olun
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
