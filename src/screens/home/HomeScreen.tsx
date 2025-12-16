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
import { CommonActions } from "@react-navigation/native";

// Importamos los tipos
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../../types";
/**
 * Tipo para las props de navegación de esta pantalla
 */
// Importacion de mis estilos
import { LinearGradient } from "expo-linear-gradient";
const Logo = require("../../../assets/logo sin fondo.png"); 
const IconEstablecimientos = require("../../../assets/establecimiento.png");
const IconJuegos = require("../../../assets/juegos.png");
const IconTorneos = require("../../../assets/torneos.png");
const IconEventos = require("../../../assets/eventos.png");



type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;
/**
 * Props que recibe el componente HomeScreen
 */
interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}
/**
 * Interfaz para definir las opciones del menú principal
 */
interface MenuOption {
   id: string;
  title: string;
  icon: string | number; 
  iconLibrary: "FontAwesome5" | "MaterialIcons" | "Entypo";
  color: string;
  route?: keyof RootStackParamList;
  onPress?: () => void;
}
/**
 * Pantalla principal del sistema
 * Muestra el menú principal con las opciones disponibles
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // Estado para controlar la visibilidad del menú
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  /**
   * Opciones del menú principal
   */
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
    route: "MateriaList",
  },
  {
    id: "eventos",
    title: "Eventos",
    icon: IconEventos, 
    iconLibrary: "FontAwesome5",
    color: "#ffffff",
    route: "GrupoList",
  },
 ];
  /**
   * Maneja el cierre de sesión
   */
  const handleLogout = (): void => {
    setMenuVisible(false);
    // Mostramos confirmación antes de cerrar sesión
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };
  /**
   * Maneja la navegación al perfil del usuario
   */
  const handleProfile = (): void => {
    console.log("Navegando a perfil de usuario");
    setMenuVisible(false);
    // Aquí iría la navegación al perfil cuando esté implementado
    handleComingSoon("Perfil de Usuario");
  };
  /**
   * Muestra mensaje de funcionalidad próximamente disponible
   */
  const handleComingSoon = (feature: string): void => {
    // Implementación básica por ahora
    console.log(`Funcionalidad: ${feature} - Próximamente disponible`);
  };
  /**
   * Abre el menú de hamburguesa
   */
  const openMenu = (): void => {
    setMenuVisible(true);
  };
  /**
   * Cierra el menú de hamburguesa
   */
  const closeMenu = (): void => {
    setMenuVisible(false);
  };
  /**
   * Maneja la navegación a las diferentes pantallas
   */
  const handleNavigation = (option: MenuOption): void => {
    if (option.route) {
      navigation.navigate(option.route);
    } else if (option.onPress) {
      option.onPress();
    }
  };
  /**
   * Renderiza un icono según la librería especificada
   */
  const renderIcon = (option: MenuOption): JSX.Element => {
  // Verificamos si la propiedad 'icon' es una imagen importada (un 'number' para require)
  if (typeof option.icon === 'number') {
    return (
      <Image 
        source={option.icon} 
        style={styles.cardImage} // Usamos un nuevo estilo para controlar el tamaño
        resizeMode="contain" // Asegura que la imagen se vea completa
      />
    );
  }

  // Si no es una imagen (por si acaso), regresa el icono anterior como fallback:
  const iconProps = {
    size: 50,
    color: option.color,
  };
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
      {/* Header con Degradado */}
      <LinearGradient
        colors={["#6a11cb", "#2575fc"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBar}
      >
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
        <FontAwesome5 name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {/* USANDO EL LOGO DE IMAGEN */}
          <Image source={Logo} style={styles.logoImage} /> 
          <Text style={styles.headerTitleText}>ZonaGamer</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={openMenu}>
          <MaterialIcons name="menu" size={30} color="white" />
        </TouchableOpacity>
      </LinearGradient>

   {/* ... Modal del menú de hamburguesa sigue igual ... */}

   {/* Grid de opciones principales */}
   {/* Eliminamos los textos de bienvenida para replicar el diseño limpio de la imagen */}
   <View style={styles.contentContainer}>
    <View style={styles.gridContainer}>
     {menuOptions.map((option, index) => (
      <TouchableOpacity
       key={option.id}
       style={styles.cardContainer}
       onPress={() => handleNavigation(option)}
       activeOpacity={0.7}
      >
       {/* Contenedor para el círculo de fondo de la imagen/icono */}
       <View style={styles.iconCircle}>
        {/* Aquí iría la imagen real, por ahora usamos el renderIcon */}
        {renderIcon({ ...option, color: option.color })}
       </View>
       {/* Botón de Degradado para el Título */}
       <LinearGradient
        colors={["#7b1fa2", "#c2185b"]} // Colores de ejemplo para el botón
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
/**
 * Estilos del componente
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  justifyContent: 'center',
  marginLeft: -30, 
 },
 logoImage: { 
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 10,
  backgroundColor: 'white', 
  borderWidth: 2,
  borderColor: 'white',
 },
 headerTitleText: {
  fontSize: 24,
  fontWeight: "bold",
  color: "white",
 },
 contentContainer: {
  flex: 1,
  paddingTop: 10,
  alignItems: "center", 
 },
 
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
  backgroundColor: 'transparent',
  
 },
 iconCircle: {
  width: '90%',
  height: '70%',
  borderRadius: 20,
  backgroundColor: '#d0e0ec',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 0,
  overflow: 'hidden',
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3.84,
 },
 cardImage: { // NUEVO ESTILO PARA LAS IMÁGENES DENTRO DE LAS TARJETAS
  width: '80%', // Ocupa el 80% del iconCircle
  height: '80%',
 },
 // El texto de la tarjeta va dentro del degradado del botón
 cardButtonGradient: { 
  width: '100%',
  height: '30%',
  justifyContent: 'center',
  alignItems: 'center',
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  paddingVertical: 5, // Menos padding para no desbordar
  marginTop: -10, // Superponemos un poco el botón sobre el círculo
 },
 cardText: {
  fontSize: 16,
  fontWeight: "bold",
  color: "white", // El texto ahora es blanco sobre el degradado
  textAlign: "center",
  paddingHorizontal: 10,
 },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
  },
  menuTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
export default HomeScreen;