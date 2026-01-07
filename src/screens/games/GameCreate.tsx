import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as gamesSvc from "../../services/games.local";
import * as estSvc from "../../services/establecimientos.local";
import * as ImagePicker from "expo-image-picker";

type Props = StackScreenProps<RootStackParamList, "gameCreate">;

export default function GameCreate({ navigation }: Props) {
  const [title, setTitle] = useState("");
  const [coverUri, setCoverUri] = useState<string | undefined>();
  const [estIdx, setEstIdx] = useState<{ id: number; nombre: string }[]>([]);
  const [availableAt, setAvailableAt] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      await estSvc.seedIfEmpty();
      const ests = await estSvc.list();
      setEstIdx(ests.map(e => ({ id: e.id, nombre: e.nombre })));
    })();
  }, []);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permiso requerido", "Autoriza acceso a tu galería.");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!res.canceled && res.assets?.length) setCoverUri(res.assets[0].uri);
  };

  const toggleLocal = (id: number) => {
    setAvailableAt(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert("Falta título", "Escribe el nombre del juego.");
    await gamesSvc.create({ title: title.trim(), coverUri, availableAt });
    Alert.alert("Creado", "Juego agregado.");
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Nuevo juego</Text>

      <View style={{ alignItems: "center", marginTop: 12 }}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverBig} />
        ) : (
          <View style={[styles.coverBig, { backgroundColor: "#111827", alignItems:"center", justifyContent:"center" }]}>
            <Text style={{ color:"#94a3b8" }}>Sin portada</Text>
          </View>
        )}
        <TouchableOpacity style={styles.btnSecondary} onPress={pickCover}>
          <Text style={styles.btnTxt}>Elegir portada</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Street Fighter 6"
        placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { marginTop: 12 }]}>Disponibles en</Text>
      {estIdx.length === 0 ? (
        <Text style={{ color:"#94a3b8" }}>No hay establecimientos.</Text>
      ) : (
        estIdx.map(e => {
          const active = availableAt.includes(e.id);
          return (
            <TouchableOpacity key={e.id} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleLocal(e.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{e.nombre}</Text>
            </TouchableOpacity>
          );
        })
      )}

      <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={save}>
        <Text style={styles.btnTxt}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#0b0f1a" },
  title:{ color:"#fff", fontWeight:"800", fontSize:20 },
  coverBig:{ width: 180, height: 180, borderRadius: 16, marginBottom: 8 },
  label:{ color:"#cbd5e1", marginTop: 12, marginBottom: 6, fontWeight:"600" },
  input:{ backgroundColor:"#111827", color:"#e5e7eb", borderRadius:10, paddingHorizontal:12, paddingVertical:12, borderWidth:1, borderColor:"#1f2937" },
  chip:{ paddingVertical:8, paddingHorizontal:12, borderRadius:10, backgroundColor:"#111827", marginBottom:8, borderWidth:1, borderColor:"#1f2937" },
  chipActive:{ backgroundColor:"#1e293b", borderColor:"#3b82f6" },
  chipText:{ color:"#cbd5e1" },
  chipTextActive:{ color:"#93c5fd", fontWeight:"700" },
  btn:{ backgroundColor:"#3b82f6", borderRadius:12, paddingVertical:14, alignItems:"center" },
  btnSecondary:{ backgroundColor:"#1e293b", borderRadius:12, paddingVertical:12, paddingHorizontal:16, marginTop:8 },
  btnTxt:{ color:"#fff", fontWeight:"700" },
});
