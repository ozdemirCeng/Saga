import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Center,
  Box,
  ThemeIcon,
  Group,
  Progress,
  List,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconLock,
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
  IconX,
} from "@tabler/icons-react";
import { Link, useSearchParams } from "react-router";
import api from "../services/api";

// Şifre gücü hesaplama
function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 6) strength += 20;
  if (password.length >= 8) strength += 20;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
  return Math.min(100, strength);
}

function getStrengthColor(strength: number): string {
  if (strength < 30) return "red";
  if (strength < 50) return "orange";
  if (strength < 70) return "yellow";
  return "green";
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      yeniSifre: "",
      yeniSifreTekrar: "",
    },
    validate: {
      yeniSifre: (value) => {
        if (!value) return "Şifre gereklidir";
        if (value.length < 6) return "Şifre en az 6 karakter olmalıdır";
        return null;
      },
      yeniSifreTekrar: (value, values) => {
        if (!value) return "Şifre tekrarı gereklidir";
        if (value !== values.yeniSifre) return "Şifreler eşleşmiyor";
        return null;
      },
    },
  });

  // Token'ı doğrula
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setError("Geçersiz sıfırlama linki. Lütfen yeni bir link talep edin.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-reset-token", { token });
        if (response.data.valid) {
          setIsTokenValid(true);
        } else {
          setError(response.data.message || "Geçersiz sıfırlama linki.");
        }
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          "Sıfırlama linki geçersiz veya süresi dolmuş.";
        setError(message);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/reset-password", {
        token,
        yeniSifre: values.yeniSifre,
        yeniSifreTekrar: values.yeniSifreTekrar,
      });
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

  const passwordStrength = getPasswordStrength(form.values.yeniSifre);
  const strengthColor = getStrengthColor(passwordStrength);

  // Token doğrulanıyor
  if (isVerifying) {
    return (
      <Container size={460} my={80}>
        <Paper withBorder shadow="md" p={40} radius="md">
          <Center>
            <Stack align="center" gap="md">
              <Loader size={50} />
              <Text>Sıfırlama linki doğrulanıyor...</Text>
            </Stack>
          </Center>
        </Paper>
      </Container>
    );
  }

  // Token geçersiz
  if (!isTokenValid && !isSuccess) {
    return (
      <Container size={460} my={80}>
        <Paper withBorder shadow="md" p={40} radius="md">
          <Center mb="lg">
            <ThemeIcon size={80} radius={80} color="red" variant="light">
              <IconX size={50} />
            </ThemeIcon>
          </Center>

          <Title ta="center" order={2} mb="md">
            Geçersiz Link
          </Title>

          <Text c="dimmed" size="sm" ta="center" mb="xl">
            {error || "Bu şifre sıfırlama linki geçersiz veya süresi dolmuş."}
          </Text>

          <Stack gap="xs">
            <Button component={Link} to="/sifremi-unuttum" fullWidth>
              Yeni Sıfırlama Linki Al
            </Button>

            <Button
              component={Link}
              to="/giris"
              fullWidth
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
            >
              Giriş Sayfasına Dön
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Başarılı sıfırlama
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
            Şifreniz Güncellendi!
          </Title>

          <Text c="dimmed" size="sm" ta="center" mb="xl">
            Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş
            yapabilirsiniz.
          </Text>

          <Button component={Link} to="/giris" fullWidth size="lg">
            Giriş Yap
          </Button>
        </Paper>
      </Container>
    );
  }

  // Şifre sıfırlama formu
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
            <IconLock size={35} />
          </ThemeIcon>
        </Center>

        <Title ta="center" order={2}>
          Yeni Şifre Belirle
        </Title>

        <Text c="dimmed" size="sm" ta="center" mt="sm" mb="xl">
          Hesabınız için yeni bir şifre oluşturun.
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
            <div>
              <PasswordInput
                label="Yeni Şifre"
                placeholder="En az 6 karakter"
                leftSection={<IconLock size={16} />}
                required
                {...form.getInputProps("yeniSifre")}
              />
              {form.values.yeniSifre && (
                <Box mt="xs">
                  <Progress
                    value={passwordStrength}
                    color={strengthColor}
                    size="xs"
                    mb={5}
                  />
                  <Text size="xs" c={strengthColor}>
                    Şifre Gücü:{" "}
                    {passwordStrength < 30
                      ? "Zayıf"
                      : passwordStrength < 50
                      ? "Orta"
                      : passwordStrength < 70
                      ? "İyi"
                      : "Güçlü"}
                  </Text>
                </Box>
              )}
            </div>

            <PasswordInput
              label="Yeni Şifre (Tekrar)"
              placeholder="Şifrenizi tekrar girin"
              leftSection={<IconLock size={16} />}
              required
              {...form.getInputProps("yeniSifreTekrar")}
            />

            <Alert variant="light" color="blue" mt="xs">
              <Text size="xs" fw={500} mb={5}>
                Güçlü bir şifre için:
              </Text>
              <List size="xs" spacing={3}>
                <List.Item>En az 6 karakter kullanın</List.Item>
                <List.Item>Büyük ve küçük harf ekleyin</List.Item>
                <List.Item>Rakam ve özel karakter kullanın</List.Item>
              </List>
            </Alert>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="md"
              mt="md"
            >
              Şifremi Güncelle
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
