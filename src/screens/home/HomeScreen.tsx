// src/screens/home/HomeScreen.tsx
import React, { JSX, useEffect, useState, useRef } from "react";
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
  Alert,
} from "react-native";
import { MaterialIcons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../types";
import { LinearGradient } from "expo-linear-gradient";
import { listOutbox } from "../../services/sync/outbox";
import { useFocusEffect } from "@react-navigation/native";


// 👇 1. Hook del contexto
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
  // 👇 2. Obtenemos usuario y logout del contexto
  const { user, signOut } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);

  const lastOutboxCountRef = useRef<number | null>(null);

  const printOutboxIfChanged = async (tag: string) => {
  const items = await listOutbox();
  const count = items.length;

  if (lastOutboxCountRef.current !== count) {
    lastOutboxCountRef.current = count;
    console.log(`📦 OUTBOX ${tag} -> ${count}`);
    if (count > 0) console.log(items);
  }
};


  useEffect(() => {
    (async () => {
      await printOutboxIfChanged("HOME");
    })();
  }, []);


    useFocusEffect(
    React.useCallback(() => {
      (async () => {
        await printOutboxIfChanged("HOME FOCUS");
      })();
    }, [])
  );


  const menuOptions: MenuOption[] = [
    {
      id: "establecimientos",
      title: "Establecimientos",
      icon: IconEstablecimientos,
      iconLibrary: "FontAwesome5",
      color: "#ffffff",
      route: "establecimientoList",
    },
    {
      id: "juegos",
      title: "Juegos",
      icon: IconJuegos,
      iconLibrary: "FontAwesome5",
      color: "#ffffff",
      route: "gameList",
    },
    {
      id: "torneos",
      title: "Torneos",
      icon: IconTorneos,
      iconLibrary: "FontAwesome5",
      color: "#ffffff",
      route: "tournamentList",
    },
    {
      id: "eventos",
      title: "Eventos",
      icon: IconEventos,
      iconLibrary: "FontAwesome5",
      color: "#ffffff",
      route: "eventList",
    },
  ];

  const goVenues = () => {
    setMenuVisible(false);
    navigation.navigate("establecimientoList");
  };
  const goGames = () => {
    setMenuVisible(false);
    navigation.navigate("gameList");
  };
  const goTournaments = () => {
    setMenuVisible(false);
    navigation.navigate("tournamentList");
  };
  const goEvents = () => {
    setMenuVisible(false);
    navigation.navigate("eventList");
  };

  const openProfile = () => {
    setMenuVisible(false);
    Alert.alert("Perfil", `Usuario: ${user?.nombre}\nRol: ${user?.role}`);
  };
  const openMyRegs = () => {
    setMenuVisible(false);
    navigation.navigate("tournamentList");
  };

  const doSync = async () => {
  setMenuVisible(false);
  try {
    const { syncNow } = await import("../../services/sync/syncEngine");
    const res = await syncNow();
    Alert.alert("Sync", `Subidos: ${res.ok}/${res.total}\nFallos: ${res.fail}`);
  } catch (e: any) {
    Alert.alert("Sync", e?.message ?? "No se pudo sincronizar");
  }
  };

  const openAbout = () => {
    setMenuVisible(false);
    Alert.alert("ZonaGamer", "v0.1\nReact Native + Expo");
  };

  // 🚪 Logout usando Contexto
  const handleLogout = () => {
    setMenuVisible(false);
    signOut(); // Esto dispara el cambio de pantalla automático a Login
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleNavigation = (option: MenuOption) => {
    // 👇 AQUÍ ESTÁ EL ARREGLO (agregamos 'as never' o 'as any')
    if (option.route) {
      navigation.navigate(option.route as never);
    } else {
      option.onPress?.();
    }
  };

  const renderIcon = (option: MenuOption): JSX.Element => {
    if (typeof option.icon === "number") {
      return (
        <Image
          source={option.icon}
          style={styles.cardImage}
          resizeMode="contain"
        />
      );
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

      {/* Header */}
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

      {/* MENÚ */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlayDark} onPress={closeMenu}>
          <View style={styles.menuContainerDark}>
            <Text style={styles.menuTitle}>Menú</Text>

            <TouchableOpacity style={styles.menuOption} onPress={goVenues}>
              <MaterialIcons name="storefront" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Establecimientos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={goGames}>
              <MaterialIcons name="sports-esports" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Juegos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={goTournaments}>
              <MaterialIcons name="emoji-events" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Torneos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={goEvents}>
              <MaterialIcons name="event" size={22} color="#93c5fd" />
              <Text style={styles.menuText}>Eventos</Text>
            </TouchableOpacity>

            <View style={{ height: 12 }} />
            <Text style={[styles.menuText, { opacity: 0.6, marginLeft: 10 }]}>
              Cuenta
            </Text>

            <TouchableOpacity style={styles.menuOption} onPress={openProfile}>
              <MaterialIcons name="person" size={22} color="#cbd5e1" />
              <Text style={styles.menuText}>Mi perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={openMyRegs}>
              <MaterialIcons
                name="assignment-turned-in"
                size={22}
                color="#cbd5e1"
              />
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

            <TouchableOpacity
              style={[styles.menuOption, { marginTop: 4 }]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={22} color="#fca5a5" />
              <Text style={[styles.menuText, { color: "#fca5a5" }]}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeMenuButton}
              onPress={closeMenu}
            >
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
              <View style={styles.iconCircle}>
                {renderIcon({ ...option, color: option.color })}
              </View>
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
  iconButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
    elevation: 0,
    shadowColor: "transparent",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginLeft: -30,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "white",
  },
  headerTitleText: { fontSize: 24, fontWeight: "bold", color: "white" },
  contentContainer: { flex: 1, paddingTop: 10, alignItems: "center" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  cardContainer: {
    width: "45%",
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "flex-start",
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  iconCircle: {
    width: "90%",
    height: "70%",
    borderRadius: 20,
    backgroundColor: "#d0e0ec",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  cardImage: { width: "80%", height: "80%" },
  cardButtonGradient: {
    width: "100%",
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 5,
    marginTop: -10,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  menuOverlayDark: {
    flex: 1,
    backgroundColor: "#0b0f1a",
    justifyContent: "flex-end",
  },
  menuContainerDark: {
    backgroundColor: "#111827",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 220,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  menuTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "#e5e7eb",
    textAlign: "center",
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  menuText: {
    fontSize: FONT_SIZES.medium,
    color: "#e5e7eb",
    marginLeft: 15,
    fontWeight: "500",
  },
  closeMenuButton: {
    alignSelf: "center",
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeMenuText: {
    fontSize: FONT_SIZES.medium,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});

export default HomeScreen;
