import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as eSvc from "../../services/events.local";
import * as gamesSvc from "../../services/games.local";
import * as estSvc from "../../services/establecimientos.local";
import { useFocusEffect } from "@react-navigation/native";

type Props = StackScreenProps<RootStackParamList, "eventList">;

const TYPE_LABEL: Record<eSvc.EventType, string> = {
  ThemeNight: "Noche temática",
  Launch: "Lanzamiento",
  WatchParty: "Viewing party",
  Promo: "Promo",
  Workshop: "Taller",
  CasualBracket: "Casual",
  Community: "Comunidad",
};

export default function EventList({ navigation }: Props) {
  const [items, setItems] = useState<eSvc.Event[]>([]);
  const [gameIdx, setGameIdx] = useState<Record<number,string>>({});
  const [estIdx, setEstIdx] = useState<Record<number,string>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    await gamesSvc.seedIfEmpty();
    await estSvc.seedIfEmpty();
    await eSvc.seedIfEmpty();

    const games = await gamesSvc.list();
    const gidx: Record<number,string> = {};
    games.forEach(g => gidx[g.id] = g.title);
    setGameIdx(gidx);

    const ests = await estSvc.list();
    const eidx: Record<number,string> = {};
    ests.forEach(e => eidx[e.id] = e.nombre);
    setEstIdx(eidx);

    const evs = await eSvc.list();
    setItems(evs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eventos</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const game = item.gameId ? gameIdx[item.gameId] : undefined;
          const venues = (item.venues || []).map(id => estIdx[id]).filter(Boolean).join(" · ");
          const sub = [
            TYPE_LABEL[item.type],
            item.date && item.time ? `${item.date} ${item.time}` : item.date ?? undefined,
            game ? `Juego: ${game}` : undefined,
          ].filter(Boolean).join("  •  ");

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("eventDetails", { id: item.id })}
            >
              {item.coverUri
                ? <Image source={{ uri: item.coverUri }} style={styles.cover} />
                : <View style={[styles.cover, { backgroundColor: "#0f172a" }]} />
              }
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.title}</Text>
                {!!sub && <Text style={styles.meta}>{sub}</Text>}
                {!!venues && <Text style={styles.venues}>Sede(s): {venues}</Text>}
                {!!item.price && <Text style={styles.price}>{item.price}{item.promo ? ` • ${item.promo}` : ""}</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("eventCreate")}
        activeOpacity={0.9}
      >
        <Text style={{ color:"#fff", fontSize:24, lineHeight:24 }}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#0b0f1a", padding:16 },
  title:{ color:"#fff", fontWeight:"700", fontSize:20, marginBottom:12 },
  card:{ flexDirection:"row", alignItems:"center", gap:12, padding:12, borderRadius:12, backgroundColor:"#141b2d" },
  cover:{ width:56, height:56, borderRadius:10, backgroundColor:"#111827" },
  name:{ color:"#fff", fontWeight:"700", fontSize:16 },
  meta:{ color:"#a0acc0", marginTop:4 },
  venues:{ color:"#93c5fd", marginTop:4 },
  price:{ color:"#fbbf24", marginTop:2, fontWeight:"700" },
  fab:{
    position:"absolute", right:16, bottom:24, width:56, height:56, borderRadius:28,
    backgroundColor:"#3b82f6", alignItems:"center", justifyContent:"center", elevation:6,
    shadowColor:"#000", shadowOpacity:0.2, shadowRadius:4, shadowOffset:{ width:0, height:2 },
  },
});
