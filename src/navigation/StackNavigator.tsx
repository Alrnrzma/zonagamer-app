// src/navigation/StackNavigator.tsx
import React from "react";
import { View, ActivityIndicator } from "react-native"; // 👈 Importamos componentes para el Loading
import { createStackNavigator } from "@react-navigation/stack";

// Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

import HomeScreen from "../screens/home/HomeScreen";

import EstablecimientoList from "../screens/establecimientos/EstablecimientoList";
import EstablecimientoDetails from "../screens/establecimientos/EstablecimientoDetails";
import EstablecimientoCreate from "../screens/establecimientos/EstablecimientoCreate";

import GameList from "../screens/games/GameList";
import GameDetails from "../screens/games/GameDetails";
import GameCreate from "../screens/games/GameCreate";

import TournamentList from "../screens/tournaments/TournamentList";
import TournamentDetails from "../screens/tournaments/TournamentDetails";
import TournamentCreate from "../screens/tournaments/TournamentCreate";

import EventList from "../screens/events/EventList";
import EventDetails from "../screens/events/EventDetails";
import EventCreate from "../screens/events/EventCreate";

import BlockedPublications from "../screens/moderation/BlockedPublications";

// ✅ Importamos el Hook del contexto en lugar de los servicios directos
import { useAuth } from "../context/AuthContext";

/**
 * Tipos navegación
 */
export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;

  // App
  Home: undefined;

  establecimientoList: undefined;
  establecimientoDetails: { id: number; nombre?: string };
  establecimientoCreate: undefined;

  gameList: undefined;
  gameDetails: { id: number };
  gameCreate: undefined;

  tournamentList: undefined;
  tournamentDetails: { id: number };
  tournamentCreate: undefined;

  eventList: undefined;
  eventDetails: { id: number };
  eventCreate: undefined;

  blockedPublications: undefined;

  GrupoList: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Estilos comunes del header
 */
const commonScreenOptions = {
  headerStyle: { backgroundColor: "#3e44afa4" },
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "bold" as const, fontSize: 18 },
};

/**
 * Stack SOLO para autenticación
 */
function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ ...commonScreenOptions }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Iniciar Sesión", headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

/**
 * Stack SOLO para la app (no existe si no hay sesión)
 */
function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ ...commonScreenOptions }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Zona Gamer",
          headerLeft: () => null,
        }}
      />

      {/* Juegos */}
      <Stack.Screen
        name="gameList"
        component={GameList}
        options={{ title: "Juegos" }}
      />
      <Stack.Screen
        name="gameDetails"
        component={GameDetails}
        options={{ title: "Editar juego" }}
      />
      <Stack.Screen
        name="gameCreate"
        component={GameCreate}
        options={{ title: "Nuevo juego" }}
      />

      {/* Establecimientos */}
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
      <Stack.Screen
        name="establecimientoCreate"
        component={EstablecimientoCreate}
        options={{ title: "Nuevo establecimiento" }}
      />

      {/* Torneos */}
      <Stack.Screen
        name="tournamentList"
        component={TournamentList}
        options={{ title: "Torneos" }}
      />
      <Stack.Screen
        name="tournamentDetails"
        component={TournamentDetails}
        options={{ title: "Detalle del torneo" }}
      />
      <Stack.Screen
        name="tournamentCreate"
        component={TournamentCreate}
        options={{ title: "Nuevo torneo" }}
      />

      {/* Eventos */}
      <Stack.Screen
        name="eventList"
        component={EventList}
        options={{ title: "Eventos" }}
      />
      <Stack.Screen
        name="eventDetails"
        component={EventDetails}
        options={{ title: "Detalle del evento" }}
      />
      <Stack.Screen
        name="eventCreate"
        component={EventCreate}
        options={{ title: "Nuevo evento" }}
      />

      <Stack.Screen
        name="blockedPublications"
        component={BlockedPublications}
        options={{ title: "Bloqueos" }}
      />
    </Stack.Navigator>
  );
}

/**
 * ✅ Auth Gate:
 * - Escucha el AuthContext.
 * - Si `user` existe, monta AppStack.
 * - Si no, monta AuthStack.
 */
const StackNavigator: React.FC = () => {
  // 👇 Obtenemos estado global
  const { user, isLoading } = useAuth();

  // Mientras carga (verifica sesión guardada), mostramos spinner
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0b0f1a",
        }}
      >
        <ActivityIndicator size="large" color="#a535c0" />
      </View>
    );
  }

  // 👇 El cambio es automático: si hay user, muestra AppStack
  return user ? <AppStack /> : <AuthStack />;
};

export default StackNavigator;
