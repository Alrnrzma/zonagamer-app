import React, { JSX, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { MaterialIcons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../types";
import { LinearGradient } from "expo-linear-gradient";


// ✅ Hook (ViewModel ligero)
import { useHomeVM } from "../../hooks/useHomeVM";

// AuthContext se queda (sesión)
import { useAuth } from "../../context/AuthContext";

const Logo = require("../../../assets/logo sin fondo.png");
const IconEstablecimientos = require("../../../assets/establecimiento.png");
const IconJuegos = require("../../../assets/juegos.png");
const IconTorneos = require("../../../assets/torneos.png");
const IconEventos = require("../../../assets/eventos.png");

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface MenuOption {
  id: string;
  title: string;
  icon: string | number;
  iconLibrary: "FontAwesome5" | "MaterialIcons" | "Entypo";
  color: string;
  route?: keyof RootStackParamList;
  onPress?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const role = String(user?.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role === "administrador";

  // ✅ Estado/lógica movida al hook
  const { loading, error, outboxCount, lastSync, doSync } = useHomeVM();

  // UI state
  const [menuVisible, setMenuVisible] = useState(false);

  const menuOptions: MenuOption[] = [
    { id: "establecimientos", title: "Establecimientos", icon: IconEstablecimientos, iconLibrary: "FontAwesome5", color: "#ffffff", route: "establecimientoList" },
    { id: "juegos", title: "Juegos", icon: IconJuegos, iconLibrary: "FontAwesome5", color: "#ffffff", route: "gameList" },
    { id: "torneos", title: "Torneos", icon: IconTorneos, iconLibrary: "FontAwesome5", color: "#ffffff", route: "tournamentList" },
    { id: "eventos", title: "Eventos", icon: IconEventos, iconLibrary: "FontAwesome5", color: "#ffffff", route: "eventList" },
  ];

  const go = (route: keyof RootStackParamList) => {
    setMenuVisible(false);
    navigation.navigate(route as never);
  };

  const openProfile = () => {
    setMenuVisible(false);
    // UI solamente muestra data del user (no datos externos)
    // Si quieres Alert aquí, está bien porque es UI.
    // Pero si te piden “UI pura”, puedes cambiarlo a una pantalla Profile.
    // (lo dejamos sencillo)
    // @ts-ignore
    alert(`Usuario: ${user?.nombre}\nRol: ${user?.role}`);
  };

  const openAbout = () => {
    setMenuVisible(false);
    // @ts-ignore
    alert("ZonaGamer v0.1\nReact Native + Expo");
  };

  const handleLogout = () => {
    setMenuVisible(false);
    signOut();
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleNavigation = (option: MenuOption) => {
    if (option.route) navigation.navigate(option.route as never);
    else option.onPress?.();
  };

  const renderIcon = (option: MenuOption): JSX.Element => {
    if (typeof option.icon === "number") {
      return <Image source={option.icon} style={styles.cardImage} resizeMode="contain" />;
    }
    const iconProps = { size: 50, color: option.color };
    switch (option.iconLibrary) {
      case "FontAwesome5":
        return <FontAwesome5 name={option.icon as any} {...iconProps} />;
      case "MaterialIcons":
        return <MaterialIcons name={option.icon as any} {...iconProps} />;
      case "Entypo":
        return <Entypo name={option.icon as any} {...iconProps} />;
      default:
        return <MaterialIcons name="help-outline" {...iconProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4c2c96" barStyle="light-content" />

      <LinearGradient
        colors={["#6a11cb", "#2575fc"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBar}
      >
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Image source={Logo} style={styles.logoImage} />
          <Text style={styles.headerTitleText}>ZonaGamer</Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={openMenu}>
          <MaterialIcons name="menu" size={30} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ✅ UI: loading / error / data */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {loading && <Text style={{ color: "white", opacity: 0.9 }}>Sincronizando...</Text>}

        {error && (
          <Text style={{ color: "#fca5a5", marginTop: 6 }}>
            Error: {error}
          </Text>
        )}

        <Text style={{ color: "white", opacity: 0.85, marginTop: 6 }}>
          Pendientes por subir (Outbox): {outboxCount}
        </Text>

        {lastSync && (
          <Text style={{ color: "white", opacity: 0.85, marginTop: 6 }}>
            Último sync: {lastSync.push.ok}/{lastSync.push.total} subidos • Fallos:{" "}
            {lastSync.push.fail} • Descargados: {lastSync.pull.total}
          </Text>
        )}
      </View>

      {/* MENÚ */}
      <Modal transparent visible={menuVisible} animationType="slide" onRequestClose={closeMenu}>
        <Pressable style={styles.menuOverlayDark} onPress={closeMenu}>
          <View style={styles.menuContainerDark}>
            <Text style={styles.menuTitle}>Menú</Text>

            <TouchableOpacity style={styles.menuOption} onPress={() => go("establecimientoList")}>
              <MaterialIcons name="storefront" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Establecimientos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => go("gameList")}>
              <MaterialIcons name="sports-esports" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Juegos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => go("tournamentList")}>
              <MaterialIcons name="emoji-events" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Torneos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => go("eventList")}>
              <MaterialIcons name="event" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Eventos</Text>
            </TouchableOpacity>

            {isAdmin && (
              <>
                <View style={{ height: 12 }} />
                <Text style={[styles.menuText, { opacity: 0.6, marginLeft: 10 }]}>
                  Administración
                </Text>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => go("blockedPublications")}
                >
                  <MaterialIcons name="block" size={22} color="#f97316" />
                  <Text style={styles.menuText}>Publicaciones bloqueadas</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 12 }} />
            <Text style={[styles.menuText, { opacity: 0.6, marginLeft: 10 }]}>Cuenta</Text>

            <TouchableOpacity style={styles.menuOption} onPress={openProfile}>
              <MaterialIcons name="person" size={22} color="#cbd5e1" />
              <Text style={styles.menuText}>Mi perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => go("tournamentList")}>
              <MaterialIcons name="assignment-turned-in" size={22} color="#cbd5e1" />
              <Text style={styles.menuText}>Mis inscripciones</Text>
            </TouchableOpacity>

            <View style={{ height: 12 }} />
            <TouchableOpacity style={styles.menuOption} onPress={doSync}>
              <MaterialIcons name="sync" size={22} color="#cbd5e1" />
              <Text style={styles.menuText}>Sincronizar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={openAbout}>
              <MaterialIcons name="info" size={22} color="#cbd5e1" />
              <Text style={styles.menuText}>Acerca de</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuOption, { marginTop: 4 }]} onPress={handleLogout}>
              <MaterialIcons name="logout" size={22} color="#fca5a5" />
              <Text style={[styles.menuText, { color: "#fca5a5" }]}>Cerrar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeMenuButton} onPress={closeMenu}>
              <Text style={styles.closeMenuText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Grid principal */}
      <View style={styles.contentContainer}>
        <View style={styles.gridContainer}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.cardContainer}
              onPress={() => handleNavigation(option)}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>{renderIcon({ ...option, color: option.color })}</View>
              <LinearGradient
                colors={["#7b1fa2", "#c2185b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardButtonGradient}
              >
                <Text style={styles.cardText}>{option.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  iconButton: { padding: 8, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10, height: 60, elevation: 0, shadowColor: "transparent" },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center", marginLeft: -30 },
  logoImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "white", borderWidth: 2, borderColor: "white" },
  headerTitleText: { fontSize: 24, fontWeight: "bold", color: "white" },
  contentContainer: { flex: 1, paddingTop: 10, alignItems: "center" },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", paddingHorizontal: 10, paddingTop: 20 },
  cardContainer: { width: "45%", marginVertical: 10, alignItems: "center", justifyContent: "flex-start", height: 180, borderRadius: 20, overflow: "hidden", backgroundColor: "transparent" },
  iconCircle: { width: "90%", height: "70%", borderRadius: 20, backgroundColor: "#d0e0ec", justifyContent: "center", alignItems: "center", marginBottom: 0, overflow: "hidden", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84 },
  cardImage: { width: "80%", height: "80%" },
  cardButtonGradient: { width: "100%", height: "30%", justifyContent: "center", alignItems: "center", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingVertical: 5, marginTop: -10 },
  cardText: { fontSize: 16, fontWeight: "bold", color: "white", textAlign: "center", paddingHorizontal: 10 },
  menuOverlayDark: { flex: 1, backgroundColor: "#0b0f1a", justifyContent: "flex-end" },
  menuContainerDark: { backgroundColor: "#111827", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 220, elevation: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: -2 } },
  menuTitle: { fontSize: FONT_SIZES.large, fontWeight: "bold", color: "#e5e7eb", textAlign: "center", marginBottom: 20 },
  menuOption: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 10, borderRadius: 8, marginBottom: 5 },
  menuText: { fontSize: FONT_SIZES.medium, color: "#e5e7eb", marginLeft: 15, fontWeight: "500" },
  closeMenuButton: { alignSelf: "center", marginTop: 15, paddingVertical: 10, paddingHorizontal: 20 },
  closeMenuText: { fontSize: FONT_SIZES.medium, color: "#9CA3AF", fontWeight: "500" },
});

export default HomeScreen;
