import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as gamesSvc from "../../services/games.local";
import * as estSvc from "../../services/establecimientos.local";
import { useFocusEffect } from "@react-navigation/native";

// 👇 NUEVO: rol y permisos
import { getCurrentUser } from "../../services/auth.local";
import { can } from "../../utils/can";
import { Role } from "../../types";

type Props = StackScreenProps<RootStackParamList, "gameList">;

export default function GameList({ navigation }: Props) {
  const [games, setGames] = useState<gamesSvc.Game[]>([]);
  const [estIdx, setEstIdx] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>("user");

  const load = async () => {
    setLoading(true);

    // Rol del usuario actual
    const me = await getCurrentUser();
    if (me?.role) setRole(me.role);

    // Aseguramos datos base
    await estSvc.seedIfEmpty();
    await gamesSvc.seedIfEmpty();

    // Mapa de establecimientos id -> nombre
    const ests = await estSvc.list();
    const idx: Record<number, string> = {};
    ests.forEach((e) => (idx[e.id] = e.nombre));
    setEstIdx(idx);

    // Juegos
    const g = await gamesSvc.list();
    setGames(g);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Juegos disponibles</Text>

      <FlatList
        data={games}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: "#94a3b8", textAlign: "center", marginTop: 24 }}>
              Sin juegos
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const locales = (item.availableAt ?? [])
            .map((id) => estIdx[id])
            .filter(Boolean)
            .join(" · ");

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("gameDetails", { id: item.id })}
            >
              {item.coverUri ? (
                <Image source={{ uri: item.coverUri }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, { backgroundColor: "#0f172a" }]} />
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.title}</Text>
                <Text style={styles.desc}>
                  {locales ? `Disponibles en: ${locales}` : "Sin locales asignados"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB para crear juego (solo admin) */}
      {can(role, "game:create") && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("gameCreate")}
          activeOpacity={0.9}
        >
          <Text style={{ color: "#fff", fontSize: 24, lineHeight: 24 }}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f1a", padding: 16 },
  title: { color: "#fff", fontWeight: "700", fontSize: 20, marginBottom: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // si tu RN no soporta gap, quita esto y usa marginRight en cover
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#141b2d",
  },
  cover: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#111827" },
  name: { color: "#fff", fontWeight: "700", fontSize: 16 },
  desc: { color: "#a0acc0", marginTop: 4 },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6, // Android
    shadowColor: "#000", // iOS
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
