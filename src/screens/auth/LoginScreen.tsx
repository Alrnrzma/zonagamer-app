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
// Importamos los tipos que definimos
import { RootStackParamList } from "../../navigation/StackNavigator";
import { LoginFormData, COLORS, FONT_SIZES } from "../../../types/index";
// Importamos la imagen
const loginImage = require("../../../assets/logo sin fondo.png");

// Imortaciones de mis librerias
import { LinearGradient } from "expo-linear-gradient";

/**
 * Tipo para las props de navegación de esta pantalla
 */
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;
/**
 * Props que recibe el componente LoginScreen
 */
interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}
/**
 * Pantalla de inicio de sesión
 * Permite a los usuarios autenticarse en el sistema
 */
const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // Estados del formulario usando el tipo LoginFormData
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  // Estado para controlar si está cargando
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /**
   * Actualiza los datos del formulario
   * @param field - Campo a actualizar ('username' o 'password')
   * @param value - Nuevo valor del campo
   */
  const updateFormData = (field: keyof LoginFormData, value: string): void => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };
  /**
   * Valida que los campos del formulario no estén vacíos
   * @returns true si los campos son válidos, false en caso contrario
   */
  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      Alert.alert("Error", "Por favor, ingrese su usuario");
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert("Error", "Por favor, ingrese su contraseña");
      return false;
    }
    if (formData.password.length < 4) {
      Alert.alert("Error", "La contraseña debe tener al menos 4 caracteres");
      return false;
    }
    return true;
  };
  /**
   * Maneja el proceso de inicio de sesión
   */
  const handleLogin = (): void => {
    if (!validateForm()) {
      return;
    }
    Alert.alert(
      "Confirmación de inicio de sesión",
      `¿Deseas iniciar sesión como ${formData.username}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Aceptar",
          onPress: authenticateUser,
        },
      ],
      { cancelable: false }
    );
  };
  /**
   * Simula el proceso de autenticación
   */
  const authenticateUser = (): void => {
    setIsLoading(true);
    // Simulamos una petición al servidor (2 segundos)
    setTimeout(() => {
      setIsLoading(false);
      // Aquí iría la lógica real de autenticación
      // Por ahora, cualquier usuario/contraseña es válido
      console.log("Usuario autenticado:", formData.username);
      // Navegamos a la pantalla principal
      navigation.replace("Home");
    }, 2000);
  };
  /**
   * Maneja la recuperación de contraseña
   */
  const handleForgotPassword = (): void => {
    Alert.alert(
      "Recuperar Contraseña",
      "Esta funcionalidad estará disponible próximamente.",
      [{ text: "Entendido" }]
    );
  };
  /**
   * Maneja el registro de nuevo usuario
   */
  const handleRegister = (): void => {
    Alert.alert(
      "Registro",
      "Esta funcionalidad estará disponible próximamente.",
      [{ text: "Entendido" }]
    );
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Logo de la aplicación */}
        <Image source={loginImage} style={styles.loginImage} />
        {/* Título */}
        <Text style={styles.title}>Bienvenido a ZonaGamer</Text>
        
        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Campo Usuario */}
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor="#377dff"
            value={formData.username}
            onChangeText={(text) => updateFormData("username", text)}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          {/* Campo Contraseña */}
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
          {/* Botón de Login */}
          <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={{ width: "100%" }}>
          <LinearGradient
          colors={["#a535c0", "#377dff"]} // gradiente violeta -> azul
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
        {/* Enlaces adicionales */}
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
          color: "#7c3aed",           // usa tu color/línea de diseño
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
/**
 * Estilos del componente
 */
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
  borderRadius: 75, // la mitad de 150
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
  borderRadius: 25, // más redondeado tipo cápsula
  paddingHorizontal: 20,
  marginBottom: 15,
  fontSize: FONT_SIZES.medium,
  backgroundColor: "#fff", // blanco como en la imagen
  color: COLORS.text,
  elevation: 3, // sombra ligera
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