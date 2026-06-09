// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { loginApi } from "../../services/auth.api"; 
import { useAuth } from "../../context/AuthContext";
import {
  login as loginLocal,
  ensureDemoUsers,
  upsertUser,
} from "../../services/auth.local";

// ⚠️ desde screens/auth -> ../../types
import { LoginFormData, COLORS, FONT_SIZES } from "../../types";

const loginImage = require("../../../assets/logo sin fondo.png");
import { LinearGradient } from "expo-linear-gradient";



// 👇 IMPORTANTE: Importamos el hook del contexto


type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // 👇 Usamos el hook para obtener la función signIn
  const { signIn } = useAuth();

  // Form
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Actualiza campo de formulario
  const updateFormData = (field: keyof LoginFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validación básica
  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      Alert.alert("Error", "Por favor, ingresa tu correo");
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert("Error", "Por favor, ingresa tu contraseña");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    return true;
  };

  // Login
  const handleLogin = (): void => {
    if (!validateForm()) return;
    authenticateUser();
  };


 const authenticateUser = async (): Promise<void> => {
  try {
    setIsLoading(true);

    const email = formData.username.trim().toLowerCase();
    const password = formData.password;

    await ensureDemoUsers();

    try {
      // ✅ Intento online con FastAPI/Supabase
      const apiUser = await loginApi(email, password);

      // ✅ Guarda usuario + contraseña localmente para poder entrar offline después
      await upsertUser({
        nombre: apiUser.nombre,
        email: apiUser.email,
        password,
        role: apiUser.role,
        status: apiUser.status ?? "active",
      } as any);

      await signIn(apiUser);
      return;
    } catch (apiError: any) {
      console.log("Login API falló, intentando login local:", apiError);

      // ✅ Fallback offline/local
      const localUser = await loginLocal(email, password);

      if (!localUser) {
        Alert.alert(
          "No se pudo iniciar sesión",
          "No hay conexión o tus datos no existen localmente."
        );
        return;
      }

      await signIn(localUser);

      Alert.alert(
        "Modo offline",
        "Iniciaste sesión con datos guardados localmente."
      );
    }
  } catch (err: any) {
    Alert.alert(
      "No se pudo iniciar sesión",
      err?.message ?? "Inténtalo de nuevo."
    );
  } finally {
    setIsLoading(false);
  }
};

  const handleForgotPassword = (): void => {
    Alert.alert("Recuperar contraseña", "Disponible próximamente.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Image source={loginImage} style={styles.loginImage} />
        <Text style={styles.title}>Bienvenido a ZonaGamer</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Correo"
            placeholderTextColor="#377dff"
            value={formData.username}
            onChangeText={(text) => updateFormData("username", text)}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#377dff"
            value={formData.password}
            onChangeText={(text) => updateFormData("password", text)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={{ width: "100%" }}
          >
            <LinearGradient
              colors={["#a535c0", "#377dff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={{ marginTop: 8, alignSelf: "center" }}
            accessibilityRole="link"
          >
            <Text
              style={{
                color: "#7c3aed",
                textDecorationLine: "underline",
                fontWeight: "600",
              }}
            >
              Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loginImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 75,
  },
  title: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.large,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: {
    width: "100%",
    maxWidth: 300,
  },
  input: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: FONT_SIZES.medium,
    backgroundColor: "#fff",
    color: COLORS.text,
    elevation: 3,
  },
  loginButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: 30,
    alignItems: "center",
    gap: 15,
  },
  link: {
    color: "#a535c0",
    fontSize: FONT_SIZES.medium,
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
