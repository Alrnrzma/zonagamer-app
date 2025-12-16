import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, RefreshControl } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as gamesSvc from "../../services/games.local";
import * as estSvc from "../../services/establecimientos.local";
import { useFocusEffect } from "@react-navigation/native";

type Props = StackScreenProps<RootStackParamList, "gameList">;

export default function GameList({ }: Props) {
  const [games, setGames] = useState<gamesSvc.Game[]>([]);
  const [estIdx, setEstIdx] = useState<Record<number,string>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    await gamesSvc.seedIfEmpty();
    // index de establecimientos id -> nombre
    const ests = await estSvc.list();
    const idx: Record<number,string> = {};
    ests.forEach(e => { idx[e.id] = e.nombre; });
    setEstIdx(idx);

    const g = await gamesSvc.list();
    setGames(g);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Juegos disponibles</Text>

      <FlatList
        data={games}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const locales = item.availableAt
            .map(id => estIdx[id])
            .filter(Boolean)
            .join(" · ");

          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#0b0f1a", padding:16 },
  title:{ color:"#fff", fontWeight:"700", fontSize:20, marginBottom:12 },
  card:{
    flexDirection:"row",
    alignItems:"center",
    gap:12,
    padding:12,
    borderRadius:12,
    backgroundColor:"#141b2d",
  },
  cover:{ width:56, height:56, borderRadius:10, backgroundColor:"#111827" },
  name:{ color:"#fff", fontWeight:"700", fontSize:16 },
  desc:{ color:"#a0acc0", marginTop:4 },
});
