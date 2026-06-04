import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as tSvc from "../../services/tournaments.local";
import * as gamesSvc from "../../services/games.local";
import * as estSvc from "../../services/establecimientos.local";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";

type Props = StackScreenProps<RootStackParamList, "tournamentDetails">;

export default function TournamentDetails({ route, navigation }: Props) {
  const { id } = route.params;

  const [t, setT] = useState<tSvc.Tournament | null>(null);
  const [title, setTitle] = useState("");
  const [coverUri, setCoverUri] = useState<string | undefined>();
  const [gameId, setGameId] = useState<number | undefined>();
  const [prize, setPrize] = useState<string>("");
  const [entryFee, setEntryFee] = useState<string>("Gratis");
  const [platform, setPlatform] = useState<tSvc.Platform>("Otro");
  const [requirements, setRequirements] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [venues, setVenues] = useState<number[]>([]);
  const [nick, setNick] = useState<string>("");

  const { user } = useAuth();
  const role = String(user?.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role === "administrador";

  const [gameIdx, setGameIdx] = useState<{ id:number; title:string }[]>([]);
  const [estIdx,  setEstIdx]  = useState<{ id:number; nombre:string }[]>([]);


  useEffect(() => {
    (async () => {
      const allGames = await gamesSvc.list();
      setGameIdx(allGames.map(g => ({ id:g.id, title:g.title })));
      const ests = await estSvc.list();
      setEstIdx(ests.map(e => ({ id:e.id, nombre:e.nombre })));

      const found = (await tSvc.list()).find(x => x.id === id) ?? null;
      setT(found);
      if (found) {
        setTitle(found.title);
        setCoverUri(found.coverUri);
        setGameId(found.gameId);
        setPrize(found.prize ?? "");
        setEntryFee(found.entryFee ?? "Gratis");
        setPlatform((found.platform as tSvc.Platform) ?? "Otro");
        setRequirements(found.requirements ?? "");
        setDate(found.date ?? "");
        setTime(found.time ?? "");
        setVenues(found.venues ?? []);
      }
    })();
  }, [id]);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permiso requerido", "Autoriza acceso a tu galería.");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!res.canceled && res.assets?.length) setCoverUri(res.assets[0].uri);
  };

  const toggleVenue = (estId: number) => {
    setVenues(prev => prev.includes(estId) ? prev.filter(x => x !== estId) : [...prev, estId]);
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert("Falta título", "Escribe el nombre del torneo.");
    const updated = await tSvc.update(id, {
      title: title.trim(), coverUri, gameId, prize: prize || undefined, entryFee,
      platform, requirements: requirements || undefined, date: date || undefined, time: time || undefined, venues,
    });
    if (updated) { setT(updated); Alert.alert("Guardado", "Cambios aplicados."); navigation.goBack(); }
  };

  const del = async () => {
    Alert.alert("Eliminar", "¿Borrar este torneo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await tSvc.remove(id); Alert.alert("Eliminado"); navigation.goBack(); } },
    ]);
  };

  const toggleBlock = async () => {
    try {
      if (!t) return;

      const updated =
        t.status === "blocked"
          ? await tSvc.unblock(id)
          : await tSvc.block(id);

      setT(updated);

      Alert.alert(
        updated.status === "blocked"
          ? "Publicación bloqueada"
          : "Publicación desbloqueada"
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo actualizar el estatus.");
    }
  };

  const doRegister = async () => {
    if (!nick.trim()) return Alert.alert("Falta nombre", "Escribe tu nick/correo para registrar.");
    try {
      const upd = await tSvc.register(id, nick.trim());
      if (upd) { setT(upd); Alert.alert("Registrado", "Quedaste inscrito."); setNick(""); }
    } catch (e:any) {
      Alert.alert("No se pudo registrar", e?.message ?? "Intenta más tarde");
    }
  };

  if (!t) return <View style={styles.container}><Text style={{ color:"#94a3b8" }}>Cargando…</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Editar torneo</Text>

      {/* portada */}
      <View style={{ alignItems:"center", marginTop:12 }}>
        {coverUri ? <Image source={{ uri: coverUri }} style={styles.coverBig} /> :
          <View style={[styles.coverBig, { backgroundColor:"#111827", alignItems:"center", justifyContent:"center" }]}>
            <Text style={{ color:"#94a3b8" }}>Sin portada</Text>
          </View>}
        <TouchableOpacity style={styles.btnSecondary} onPress={pickCover}>
          <Text style={styles.btnTxt}>Elegir portada</Text>
        </TouchableOpacity>
      </View>

      {/* título */}
      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} placeholder="Torneo SF6 – Final" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />

      {/* juego (simple selector textual por ahora) */}
      <Text style={styles.label}>Juego</Text>
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

      {/* premio / fee / plataforma */}
      <Text style={styles.label}>Premio</Text>
      <TextInput style={styles.input} placeholder="$10,000 MXN" placeholderTextColor="#9CA3AF" value={prize} onChangeText={setPrize} />

      <Text style={styles.label}>Costo de inscripción</Text>
      <TextInput style={styles.input} placeholder="Gratis / $100 MXN" placeholderTextColor="#9CA3AF" value={entryFee} onChangeText={setEntryFee} />

      <Text style={styles.label}>Plataforma</Text>
      <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
        {(["Xbox","PlayStation","PC","Switch","Otro"] as tSvc.Platform[]).map(p => {
          const active = platform === p;
          return (
            <TouchableOpacity key={p} style={[styles.chip, active && styles.chipActive]} onPress={() => setPlatform(p)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* requisitos */}
      <Text style={styles.label}>Requisitos</Text>
      <TextInput style={[styles.input, { height:90, textAlignVertical:"top" }]} multiline placeholder="Tener cuenta, traer control, etc." placeholderTextColor="#9CA3AF" value={requirements} onChangeText={setRequirements} />

      {/* fecha/hora */}
      <Text style={styles.label}>Fecha</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={date} onChangeText={setDate} />
      <Text style={styles.label}>Hora</Text>
      <TextInput style={styles.input} placeholder="HH:mm" placeholderTextColor="#9CA3AF" value={time} onChangeText={setTime} />

      {/* sedes */}
      <Text style={[styles.label, { marginTop: 12 }]}>Sedes</Text>
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

      {/* acciones */}
      <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={save}><Text style={styles.btnTxt}>Guardar</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor:"#ef4444", marginTop:8 }]} onPress={del}><Text style={styles.btnTxt}>Eliminar</Text></TouchableOpacity>
      {isAdmin && (
        <TouchableOpacity
          style={[
            styles.btn,
            {
              backgroundColor: t.status === "blocked" ? "#22c55e" : "#f97316",
              marginTop: 8,
            },
          ]}
          onPress={toggleBlock}
        >
          <Text style={styles.btnTxt}>
            {t.status === "blocked"
              ? "Desbloquear publicación"
              : "Bloquear publicación"}
          </Text>
        </TouchableOpacity>
      )}

      {/* registro simple de participante */}
      <Text style={[styles.label, { marginTop: 16 }]}>Registrarme</Text>
      <View style={{ flexDirection:"row", gap:8 }}>
        <TextInput style={[styles.input, { flex:1 }]} placeholder="Tu nick o email" placeholderTextColor="#9CA3AF" value={nick} onChangeText={setNick} />
        <TouchableOpacity style={[styles.btn, { paddingVertical:12, paddingHorizontal:16 }]} onPress={doRegister}>
          <Text style={styles.btnTxt}>Ok</Text>
        </TouchableOpacity>
      </View>

      {!!t.participants?.length && (
        <>
          <Text style={[styles.label, { marginTop: 12 }]}>Inscritos ({t.participants.length}{t.maxParticipants?`/${t.maxParticipants}`:""})</Text>
          {t.participants.map(p => <Text key={p} style={{ color:"#cbd5e1", marginTop:4 }}>• {p}</Text>)}
        </>
      )}
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
