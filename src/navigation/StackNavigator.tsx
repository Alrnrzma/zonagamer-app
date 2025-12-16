import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Importación de pantallas
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/home/HomeScreen";
import EstablecimientoList from "../screens/establecimientos/EstablecimientoList";
import EstablecimientoDetails from "../screens/establecimientos/EstablecimientoDetails";
import RegisterScreen from "../screens/auth/RegisterScreen";
import GameList from "../screens/games/GameList";
/**
 * Definición de los tipos para los parámetros de navegación
 * Esto ayuda a TypeScript a entender qué parámetros espera cada pantalla
 */

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  establecimientoList: undefined;
   establecimientoDetails: { id: number; nombre?: string };
  Register: undefined;
  GrupoList: undefined;
  gameList: undefined;
};
/**
 * Creamos el Stack Navigator con tipado
 */
const Stack = createStackNavigator<RootStackParamList>();
/**
 * Componente principal de navegación
 * Gestiona todas las rutas de la aplicación
 */
const StackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#3e44afa4",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
      }}
    >
      {/* Pantalla de Login */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Iniciar Sesión",
          headerShown: false,   
        }}
      />
      {/* Pantalla Registro */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Zona Gamer",
          headerLeft: () => null,
        }}  
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}   
      />
      {/* Pantalla de juegos */}
      <Stack.Screen
      name="gameList"
      component={GameList}
      options={{ title: "Juegos" }}
      />
      {/* Pantallas de establecimientos */}
       <Stack.Screen
          name="establecimientoList"
          component={EstablecimientoList}
          options={{ title: "Establecimientos" }}
        />
        <Stack.Screen
          name="establecimientoDetails"
          component={EstablecimientoDetails}
          options={{ title: "Detalle" }}
      />
    </Stack.Navigator>
  );
};
export default StackNavigator;