// src/screens/auth/RegisterScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";


// 👇 helpers de sesión local y tipos
import { registerApi } from "../../services/auth.api";
import { Role } from "../../types";
import { upsertUser } from "../../services/auth.local";

// ✅ IMPORTANTE: Importamos el hook del contexto
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }: Props) {
  // 👇 Obtenemos la función signIn del contexto
  const { signIn } = useAuth();

  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // 👇 selector de rol
  const [role, setRole] = useState<Role>("user");

  const formValid = useMemo(() => {
    return (
      nombre.trim().length >= 3 &&
      EMAIL_RE.test(email) &&
      password.length >= 6 &&
      password === confirm
    );
  }, [nombre, email, password, confirm]);

  // crea el usuario en firebase auth + firestore + local y loguea
  const handleRegister = async () => {
    if (!formValid) return;

    setLoading(true);

    const payload = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password,
      telefono: telefono.trim() || undefined,
      role,
    };

    try {
      try {
        // ✅ Registro online con Firebase
        const created = await registerApi(payload);

        await signIn(created);

        Alert.alert("Cuenta creada", "Tu registro fue exitoso.");
      } catch (firebaseError: any) {
        console.log("Registro Firebase falló, creando usuario local:", firebaseError);

        // ✅ Registro local si no hay internet
        const created = await upsertUser({
          ...payload,
          status: "active",
        });

        await signIn(created);

        Alert.alert(
          "Cuenta local creada",
          "No hubo conexión con Firebase. Tu cuenta se guardó localmente."
        );
      }
    } catch (err: any) {
      Alert.alert("No se pudo registrar", err?.message ?? "Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4c2c96" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["#6a11cb", "#2575fc"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + 8,
            minHeight: insets.top + 64,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
              fontSize: 18,
              marginBottom: 2,
            }}
          >
            ZonaGamer
          </Text>
          <Text style={{ color: "#e5e7eb", fontWeight: "600", fontSize: 12 }}>
            Crear cuenta
          </Text>
        </View>

        <View style={styles.iconButton} />
      </LinearGradient>

      {/* Formulario */}
      <View style={styles.form}>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor="#9CA3AF"
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />

        <Text style={styles.label}>Teléfono (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="10 dígitos"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
          returnKeyType="next"
        />

        {/* Selector de Rol */}
        <Text style={styles.label}>Tipo de cuenta</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => setRole("user")}
            style={[styles.chip, role === "user" && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                role === "user" && styles.chipTextActive,
              ]}
            >
              Usuario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole("admin")}
            style={[styles.chip, role === "admin" && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                role === "admin" && styles.chipTextActive,
              ]}
            >
              Admin (local)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPass((v) => !v)}
            style={styles.eyeBtn}
          >
            <MaterialIcons
              name={showPass ? "visibility-off" : "visibility"}
              size={22}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Repite la contraseña"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showConfirm}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm((v) => !v)}
            style={styles.eyeBtn}
          >
            <MaterialIcons
              name={showConfirm ? "visibility-off" : "visibility"}
              size={22}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* Estado de validación */}
        <View style={styles.hints}>
          <Hint ok={nombre.trim().length >= 3} text="Nombre de 3+ caracteres" />
          <Hint ok={EMAIL_RE.test(email)} text="Correo con formato válido" />
          <Hint ok={password.length >= 6} text="Contraseña de 6+ caracteres" />
          <Hint
            ok={password === confirm && confirm.length > 0}
            text="Las contraseñas coinciden"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.btn,
            !formValid || loading ? styles.btnDisabled : null,
          ]}
          onPress={handleRegister}
          disabled={!formValid || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.btnText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={{ marginTop: 14 }}
        >
          <Text style={{ color: "#60a5fa", textAlign: "center" }}>
            Ya tengo una cuenta
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/** Mini componente de pista/validación */
function Hint({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={styles.hintRow}>
      <MaterialIcons
        name={ok ? "check-circle" : "cancel"}
        size={18}
        color={ok ? "#22c55e" : "#ef4444"}
      />
      <Text style={[styles.hintText, { color: ok ? "#9CA3AF" : "#ef9a9a" }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f1a" },
  headerBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: { padding: 8 },

  form: { padding: 16 },
  label: {
    color: "#cbd5e1",
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#111827",
    color: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  inputFlex: { flex: 1 },
  eyeBtn: { marginLeft: 8, padding: 8 },

  // Chips de rol
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  chipActive: { backgroundColor: "#1e293b", borderColor: "#3b82f6" },
  chipText: { color: "#cbd5e1" },
  chipTextActive: { color: "#93c5fd", fontWeight: "700" },

  // Validación
  hints: { marginVertical: 10 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  hintText: { marginLeft: 6 },

  // Botón principal
  btn: {
    marginTop: 8,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
