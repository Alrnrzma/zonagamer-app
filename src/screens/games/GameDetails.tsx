import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as gamesSvc from "../../services/games.local";
import * as estSvc from "../../services/establecimientos.local";
import * as ImagePicker from "expo-image-picker";

// 👇 NUEVO: rol y permisos
import { getCurrentUser } from "../../services/auth.local";
import { can } from "../../utils/can";
import { Role } from "../../types";

type Props = StackScreenProps<RootStackParamList, "gameDetails">;

export default function GameDetails({ route, navigation }: Props) {
  const { id } = route.params;                 // id = 0 => crear
  const creating = id === 0;

  const [role, setRole] = useState<Role>("user");
  const [game, setGame] = useState<gamesSvc.Game | null>(null);
  const [title, setTitle] = useState("");
  const [coverUri, setCoverUri] = useState<string | undefined>(undefined);
  const [estIdx, setEstIdx] = useState<{ id: number; nombre: string }[]>([]);
  const [availableAt, setAvailableAt] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      // rol actual
      const me = await getCurrentUser();
      if (me?.role) setRole(me.role);

      // cargar establecimientos para los chips
      const ests = await estSvc.list();
      setEstIdx(ests.map(e => ({ id: e.id, nombre: e.nombre })));

      if (creating) {
        // Modo crear: formulario vacío
        setGame({
          id: 0,
          title: "",
          coverUri: undefined,
          availableAt: [],
          createdAt: new Date().toISOString(),
        } as gamesSvc.Game);
        setTitle("");
        setCoverUri(undefined);
        setAvailableAt([]);
      } else {
        // Modo editar
        const g = await gamesSvc.getById(id);
        setGame(g);
        if (g) {
          setTitle(g.title);
          setCoverUri(g.coverUri);
          setAvailableAt(g.availableAt ?? []);
        }
      }
    })();
  }, [id, creating]);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Autoriza el acceso a tu galería.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.length) {
      setCoverUri(res.assets[0].uri);
    }
  };

  const toggleLocal = (estId: number) => {
    setAvailableAt(prev => prev.includes(estId) ? prev.filter(x => x !== estId) : [...prev, estId]);
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert("Falta título", "Escribe el nombre del juego.");
      return;
    }
    if (creating) {
      // crear
      const created = await gamesSvc.create({
        title: title.trim(),
        coverUri,
        availableAt,
      });
      Alert.alert("Creado", "Juego agregado al catálogo.");
      navigation.goBack();
      return;
    }
    // actualizar
    const updated = await gamesSvc.update(id, {
      title: title.trim(),
      coverUri,
      availableAt,
    });
    if (updated) {
      setGame(updated);
      Alert.alert("Guardado", "Cambios aplicados.");
      navigation.goBack();
    }
  };

  const del = async () => {
    Alert.alert("Eliminar", "¿Borrar este juego del catálogo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await gamesSvc.remove(id);
          Alert.alert("Eliminado", "Juego eliminado.");
          navigation.goBack();
        },
      },
    ]);
  };

  // Pantalla de carga / no encontrado (en editar)
  if (!creating && !game) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#94a3b8" }}>Cargando…</Text>
      </View>
    );
  }

  const canEdit = can(role, creating ? "game:create" : "game:update");
  const canDelete = !creating && can(role, "game:delete");

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{creating ? "Nuevo juego" : "Editar juego"}</Text>

      {/* Portada */}
      <View style={{ alignItems: "center", marginTop: 12 }}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverBig} />
        ) : (
          <View style={[styles.coverBig, { backgroundColor: "#111827", alignItems:"center", justifyContent:"center" }]}>
            <Text style={{ color:"#94a3b8" }}>Sin portada</Text>
          </View>
        )}
        {canEdit && (
          <TouchableOpacity style={styles.btnSecondary} onPress={pickCover}>
            <Text style={styles.btnTxt}>Elegir portada</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Título */}
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={[styles.input, !canEdit && { opacity: 0.6 }]}
        placeholder="Ej: Street Fighter 6"
        placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={setTitle}
        editable={canEdit}
      />

      {/* Locales donde está disponible */}
      <Text style={[styles.label, { marginTop: 12 }]}>Disponibles en</Text>
      {estIdx.length === 0 ? (
        <Text style={{ color:"#94a3b8" }}>No hay establecimientos.</Text>
      ) : (
        estIdx.map(e => {
          const active = availableAt.includes(e.id);
          return (
            <TouchableOpacity
              key={e.id}
              style={[
                styles.chip,
                active && styles.chipActive,
                !canEdit && { opacity: 0.6 },
              ]}
              onPress={() => canEdit && toggleLocal(e.id)}
              disabled={!canEdit}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {e.nombre}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Guardar (crear/actualizar) */}
      {canEdit && (
        <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={save}>
          <Text style={styles.btnTxt}>{creating ? "Crear" : "Guardar"}</Text>
        </TouchableOpacity>
      )}

      {/* Eliminar (solo editar y admin) */}
      {canDelete && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#ef4444", marginTop: 8 }]}
          onPress={del}
        >
          <Text style={styles.btnTxt}>Eliminar</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#0b0f1a" },
  title:{ color:"#fff", fontWeight:"800", fontSize:20 },
  coverBig:{ width: 180, height: 180, borderRadius: 16, marginBottom: 8 },
  label:{ color:"#cbd5e1", marginTop: 12, marginBottom: 6, fontWeight:"600" },
  input:{
    backgroundColor:"#111827", color:"#e5e7eb",
    borderRadius:10, paddingHorizontal:12, paddingVertical:12,
    borderWidth:1, borderColor:"#1f2937"
  },
  chip:{
    paddingVertical:8, paddingHorizontal:12, borderRadius:10,
    backgroundColor:"#111827", marginBottom:8, borderWidth:1, borderColor:"#1f2937"
  },
  chipActive:{ backgroundColor:"#1e293b", borderColor:"#3b82f6" },
  chipText:{ color:"#cbd5e1" },
  chipTextActive:{ color:"#93c5fd", fontWeight:"700" },
  btn:{ backgroundColor:"#3b82f6", borderRadius:12, paddingVertical:14, alignItems:"center" },
  btnSecondary:{ backgroundColor:"#1e293b", borderRadius:12, paddingVertical:12, paddingHorizontal:16, marginTop:8 },
  btnTxt:{ color:"#fff", fontWeight:"700" },
});
