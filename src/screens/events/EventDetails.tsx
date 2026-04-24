import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as eSvc from "../../services/events.local";
import * as gamesSvc from "../../services/games.local";
import * as estSvc from "../../services/establecimientos.local";
import * as ImagePicker from "expo-image-picker";

type Props = StackScreenProps<RootStackParamList, "eventDetails">;

export default function EventDetails({ route, navigation }: Props) {
  const { id } = route.params;

  const [ev, setEv] = useState<eSvc.Event | null>(null);
  const [title, setTitle] = useState("");
  const [coverUri, setCoverUri] = useState<string | undefined>();
  const [type, setType] = useState<eSvc.EventType>("Community");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [endTime, setEndTime] = useState("");
  const [gameId, setGameId] = useState<number | undefined>();
  const [venues, setVenues] = useState<number[]>([]);
  const [price, setPrice] = useState("Gratis"); const [promo, setPromo] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  // para registro de asistencia
  const [attending, setAttending] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [gameIdx, setGameIdx] = useState<{ id:number; title:string }[]>([]);
  const [estIdx,  setEstIdx]  = useState<{ id:number; nombre:string }[]>([]);


  const CURRENT_USER_ID = "demo@zonagamer.com";

  const loadAttendance = async () => {
    const isGoing = await eSvc.isUserAttending(id, CURRENT_USER_ID);
    const total = await eSvc.countAttendance(id);

    setAttending(isGoing);
    setAttendanceCount(total);
  };

  // --- carga de datos inicial ---
  useEffect(() => {
  (async () => {
    setGameIdx((await gamesSvc.list()).map(g => ({ id:g.id, title:g.title })));
    setEstIdx((await estSvc.list()).map(e => ({ id:e.id, nombre:e.nombre })));
    const found = (await eSvc.list()).find(x => x.id === id) ?? null;
    setEv(found);

    if (found) {
      setTitle(found.title);
      setCoverUri(found.coverUri);
      setType(found.type);
      setDescription(found.description ?? "");
      setDate(found.date ?? "");
      setTime(found.time ?? "");
      setEndTime(found.endTime ?? "");
      setGameId(found.gameId);
      setVenues(found.venues ?? []);
      setPrice(found.price ?? "Gratis");
      setPromo(found.promo ?? "");
      setCapacity(found.capacity ? String(found.capacity) : "");
    }

    await loadAttendance();
  })();
}, [id]);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permiso requerido", "Autoriza acceso a tu galería.");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!res.canceled && res.assets?.length) setCoverUri(res.assets[0].uri);
  };

  const toggleVenue = (eid: number) => {
    setVenues(prev => prev.includes(eid) ? prev.filter(x => x !== eid) : [...prev, eid]);
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert("Falta título", "Escribe el nombre del evento.");
    const cap = capacity.trim() ? Number(capacity) : undefined;
    if (cap !== undefined && (Number.isNaN(cap) || cap <= 0)) return Alert.alert("Cupo inválido", "Indica un número mayor a 0.");
    const updated = await eSvc.update(id, {
      title: title.trim(), coverUri, type, description: description || undefined,
      date: date || undefined, time: time || undefined, endTime: endTime || undefined,
      gameId, venues, price: price || "Gratis", promo: promo || undefined, capacity: cap
    });
    if (updated) { setEv(updated); Alert.alert("Guardado", "Cambios aplicados."); navigation.goBack(); }
  };

  const del = async () => {
    Alert.alert("Eliminar", "¿Borrar este evento?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await eSvc.remove(id); Alert.alert("Eliminado"); navigation.goBack(); } },
    ]);
  };

  // --- funciones para registro de asistencia ---
  const toggleAttendance = async () => {
  try {
    setLoadingAttendance(true);

    if (attending) {
      await eSvc.cancelAttendance(id, CURRENT_USER_ID);
      setAttending(false);
      setAttendanceCount(prev => Math.max(0, prev - 1));
      Alert.alert("Asistencia cancelada");
    } else {
      await eSvc.confirmAttendance(id, CURRENT_USER_ID);
      setAttending(true);
      setAttendanceCount(prev => prev + 1);
      Alert.alert("Asistencia confirmada");
    }
  } catch (e: any) {
    Alert.alert("No se pudo actualizar", e?.message ?? "Intenta más tarde");
  } finally {
    setLoadingAttendance(false);
  }
};

  const TYPES: eSvc.EventType[] = ["ThemeNight","Launch","WatchParty","Promo","Workshop","CasualBracket","Community"];

  if (!ev) return <View style={styles.container}><Text style={{ color:"#94a3b8" }}>Cargando…</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Editar evento</Text>

      <View style={{ alignItems:"center", marginTop:12 }}>
        {coverUri ? <Image source={{ uri: coverUri }} style={styles.coverBig} /> :
          <View style={[styles.coverBig, { backgroundColor:"#111827", alignItems:"center", justifyContent:"center" }]}><Text style={{ color:"#94a3b8" }}>Sin portada</Text></View>}
        <TouchableOpacity style={styles.btnSecondary} onPress={pickCover}>
          <Text style={styles.btnTxt}>Elegir portada</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} placeholder="Noche Retro / Viewing Party..." placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Tipo</Text>
      <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
        {TYPES.map(t => {
          const active = type === t;
          return (
            <TouchableOpacity key={t} style={[styles.chip, active && styles.chipActive]} onPress={() => setType(t)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Descripción</Text>
      <TextInput style={[styles.input, { height:90, textAlignVertical:"top" }]} multiline placeholder="Detalles..." placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} />

      <Text style={styles.label}>Juego (opcional)</Text>
      <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
        {gameIdx.map(g => {
          const active = gameId === g.id;
          return (
            <TouchableOpacity key={g.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setGameId(g.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{g.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Fecha</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={date} onChangeText={setDate} />
      <Text style={styles.label}>Hora inicio</Text>
      <TextInput style={styles.input} placeholder="HH:mm" placeholderTextColor="#9CA3AF" value={time} onChangeText={setTime} />
      <Text style={styles.label}>Hora fin (opcional)</Text>
      <TextInput style={styles.input} placeholder="HH:mm" placeholderTextColor="#9CA3AF" value={endTime} onChangeText={setEndTime} />

      <Text style={styles.label}>Sedes</Text>
      <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
        {estIdx.map(e => {
          const active = venues.includes(e.id);
          return (
            <TouchableOpacity key={e.id} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleVenue(e.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{e.nombre}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Precio</Text>
      <TextInput style={styles.input} placeholder="Gratis / $50 MXN" placeholderTextColor="#9CA3AF" value={price} onChangeText={setPrice} />
      <Text style={styles.label}>Promo (opcional)</Text>
      <TextInput style={styles.input} placeholder="2x1, Happy Hour..." placeholderTextColor="#9CA3AF" value={promo} onChangeText={setPromo} />
      <Text style={styles.label}>Cupo (opcional)</Text>
      <TextInput style={styles.input} keyboardType="number-pad" placeholder="32" placeholderTextColor="#9CA3AF" value={capacity} onChangeText={setCapacity} />

      <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={save}><Text style={styles.btnTxt}>Guardar</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor:"#ef4444", marginTop:8 }]} onPress={del}><Text style={styles.btnTxt}>Eliminar</Text></TouchableOpacity>

      <Text style={[styles.label, { marginTop: 16 }]}>Asistencia</Text>


      <Text style={{ color:"#cbd5e1", marginBottom: 8 }}>
  Asistentes: {attendanceCount}{capacity ? ` / ${capacity}` : ""}
</Text>
{/* Botón para confirmar/cancelar asistencia */}
<TouchableOpacity
  style={[
    styles.btn,
    {
      marginTop: 4,
      backgroundColor: attending ? "#ef4444" : "#22c55e",
      opacity: loadingAttendance ? 0.7 : 1,
    }
  ]}
  onPress={toggleAttendance}
  disabled={loadingAttendance}
>
  <Text style={styles.btnTxt}>
    {loadingAttendance
      ? "Procesando..."
      : attending
        ? "Cancelar asistencia"
        : "Confirmar asistencia"}
  </Text>
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
