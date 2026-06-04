import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import * as eSvc from "../../services/events.local";
import * as tSvc from "../../services/tournaments.local";

type BlockedItem = {
  id: number;
  title: string;
  kind: "event" | "tournament";
};

export default function BlockedPublications() {
  const { user } = useAuth();
  const role = String(user?.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role === "administrador";

  const [items, setItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    const events = await eSvc.list();
    const tournaments = await tSvc.list();

    const blockedEvents: BlockedItem[] = events
      .filter((ev) => ev.status === "blocked")
      .map((ev) => ({
        id: ev.id,
        title: ev.title,
        kind: "event",
      }));

    const blockedTournaments: BlockedItem[] = tournaments
      .filter((t) => t.status === "blocked")
      .map((t) => ({
        id: t.id,
        title: t.title,
        kind: "tournament",
      }));

    setItems([...blockedEvents, ...blockedTournaments]);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const unlock = async (item: BlockedItem) => {
    try {
      if (!isAdmin) {
        Alert.alert(
          "Sin permiso",
          "Solo un administrador puede desbloquear publicaciones."
        );
        return;
      }

      if (item.kind === "event") {
        await eSvc.unblock(item.id);
      } else {
        await tSvc.unblock(item.id);
      }

      Alert.alert("Listo", "La publicación fue desbloqueada.");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo desbloquear.");
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Moderación</Text>
        <Text style={styles.empty}>
          No tienes permiso para ver publicaciones bloqueadas.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publicaciones bloqueadas</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}_${item.id}`}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No hay publicaciones bloqueadas.</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.kind === "event" ? "Evento" : "Torneo"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => unlock(item)}
            >
              <Text style={styles.btnTxt}>Desbloquear</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f1a",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 22,
    marginBottom: 14,
  },
  empty: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#141b2d",
  },
  name: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  meta: {
    color: "#f97316",
    marginTop: 4,
    fontWeight: "700",
  },
  btn: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  btnTxt: {
    color: "#fff",
    fontWeight: "700",
  },
});