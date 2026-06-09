import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as svc from "../../services/establecimientos.local";
import { useFocusEffect } from "@react-navigation/native";
import { getCurrentUser } from "../../services/auth.local";
import { can } from "../../utils/can";
import { Role } from "../../types";

type Props = StackScreenProps<RootStackParamList, "establecimientoList">;

export default function EstablecimientoList({ navigation }: Props) {
  const [data, setData] = useState<svc.Establecimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>("user");

  const load = async () => {
    setLoading(true);

    // 👇 lee el usuario actual y setea rol
    const me = await getCurrentUser();
    if (me?.role) setRole(me.role);

    // siembra demo la 1a vez y lista desde AsyncStorage
    await svc.seedIfEmpty();
    const arr = await svc.list();
    setData(arr);

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
      <Text style={styles.title}>Establecimientos</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("establecimientoDetails", { id: item.id })
            }
            activeOpacity={0.8}
          >
            {/* miniatura */}
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: "#0f172a" }]} />
            )}

            {/* texto a la derecha */}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.nombre}</Text>
              <Text style={styles.addr}>
                {item.address ??
                  item.direccion ??
                  (item.location
                    ? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`
                    : "")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text
              style={{ color: "#94a3b8", textAlign: "center", marginTop: 24 }}
            >
              Sin establecimientos
            </Text>
          ) : null
        }
      />

      {/* FAB para crear nuevo establecimiento (solo admin) */}
      {can(role, "venue:create") && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            // usamos la misma pantalla de detalles para "crear" con id = 0
            navigation.navigate("establecimientoDetails", { id: 0 })
          }
          activeOpacity={0.9}
        >
          <Text style={{ color: "#fff", fontSize: 28, lineHeight: 28 }}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0b0f1a" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#fff" },
  name: { fontSize: 16, fontWeight: "600", color: "#fff" },
  addr: { marginTop: 4, color: "#a0acc0" },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#141b2d",
    flexDirection: "row",
    alignItems: "center",
    // si tu RN no soporta 'gap', puedes quitarlo y usar marginRight en thumb
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#111827",
  },
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
