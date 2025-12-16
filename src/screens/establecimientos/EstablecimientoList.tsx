import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { Image } from "react-native";

import * as svc from "../../services/establecimientos.local";
import { useFocusEffect } from "@react-navigation/native";

type Props = StackScreenProps<RootStackParamList, "establecimientoList">;

export default function EstablecimientoList({ navigation }: Props) {
  const [data, setData] = useState<svc.Establecimiento[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    await svc.seedIfEmpty();          // 👈 siembra 3 items demo la 1a vez
    const arr = await svc.list();     // 👈 lee de AsyncStorage
    setData(arr);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

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
    onPress={() => navigation.navigate("establecimientoDetails", { id: item.id })}
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
        {item.address
          ?? item.direccion
          ?? (item.location
               ? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`
               : "")}
      </Text>
    </View>
  </TouchableOpacity>
)}
        ListEmptyComponent={!loading ? <Text style={{ color:"#94a3b8", textAlign:"center", marginTop:24 }}>Sin establecimientos</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16, backgroundColor:"#0b0f1a" },
  title:{ fontSize:22, fontWeight:"700", marginBottom:12, color:"#fff" },
  name:{ fontSize:16, fontWeight:"600", color:"#fff" },
  addr:{ marginTop:4, color:"#a0acc0" },
  card: {
  padding: 12,
  borderRadius: 12,
  backgroundColor: "#141b2d",
  flexDirection: "row",           
  alignItems: "center",
  gap: 12,
},
thumb: {
  width: 48,
  height: 48,
  borderRadius: 10,
  backgroundColor: "#111827",     
},

  
});
