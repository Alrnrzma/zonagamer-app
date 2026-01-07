import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, TextInput, ScrollView } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { Linking, Platform } from "react-native"
import MapView, { Marker } from "react-native-maps";
import * as svc from "../../services/establecimientos.local";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Stars from "../../components/Stars";
import * as gamesSvc from "../../services/games.local";



type Props = StackScreenProps<RootStackParamList, "establecimientoDetails">;

export default function EstablecimientoDetails({ route, navigation }: Props) {
  const { id } = route.params;
  const [item, setItem] = useState<svc.Establecimiento | null>(null);

  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [rating, setRating] = useState<number>(0);
  const [openTime, setOpenTime] = useState<string>("");
  const [closeTime, setCloseTime] = useState<string>("");
  const [coords, setCoords] = useState<{lat:number;lng:number} | undefined>();
  const [address, setAddress] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [gameIdx, setGameIdx] = useState<{ id: number; title: string }[]>([]);
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);


  useEffect(() => {
  (async () => {
    // 1) cargar juegos (para chips) SIEMPRE
    const gs = await gamesSvc.list();
    setGameIdx(gs.map(g => ({ id: g.id, title: g.title })));

    // ✅ MODO CREAR (id=0)
    if (id === 0) {
      const empty: svc.Establecimiento = {
        id: 0,
        nombre: "Nuevo establecimiento",
        direccion: "",
        rating: 0,
        games: [],
      };

      
      setItem(empty);
      setPhotoUri(undefined);
      setRating(0);
      setOpenTime("");
      setCloseTime("");
      setCoords(undefined);
      setAddress("");
      setNombre("");
      setDireccion("");
      setSelectedGameIds([]);
      return;
    }

    // ✅ MODO EDITAR
    const it = await svc.getById(id);
    setItem(it ?? null);

    if (it) {
      setPhotoUri(it.photoUri);
      setRating(it.rating ?? 0);
      setOpenTime(it.openTime ?? "");
      setCloseTime(it.closeTime ?? "");
      setCoords(it.location);
      setAddress(it.address ?? "");
      setNombre(it.nombre ?? "");
      setDireccion(it.direccion ?? "");
      setOpenTime(it.openTime ?? "");
      setCloseTime(it.closeTime ?? "");
      setAddress(it.address ?? "");

      const selected = gs
        .filter(g => (it.games ?? []).includes(g.title))
        .map(g => g.id);
      setSelectedGameIds(selected);
      
    }
  })();
}, [id]);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permiso", "Habilita el acceso a tu galería.");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.length) setPhotoUri(res.assets[0].uri);
  };

  const getLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return Alert.alert("Permiso", "Ubicación denegada.");
  }
  const loc = await Location.getCurrentPositionAsync({});
  const lat = loc.coords.latitude;
  const lng = loc.coords.longitude;

  // Reverse geocoding → dirección legible
  const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
  const p = places[0];
  const pretty =
    p
      ? [
          p.street || p.name,
          p.streetNumber,
          p.subregion || p.city,
          p.region,
          p.postalCode,
          p.country,
        ]
          .filter(Boolean)
          .join(", ")
      : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  setCoords({ lat, lng });
  setAddress(pretty);             
};

const toggleGame = (gameId: number) => {
  setSelectedGameIds(prev =>
    prev.includes(gameId) ? prev.filter(x => x !== gameId) : [...prev, gameId]
  );
};


  const save = async () => {
  const selectedTitles = gameIdx
  .filter(g => selectedGameIds.includes(g.id))
  .map(g => g.title);


  // ✅ crear
  if (id === 0) {
    const created = await svc.create({
      nombre: nombre.trim() || "Nuevo establecimiento",
      direccion: direccion.trim() || undefined,
      photoUri,
      rating,
      games: selectedTitles,
      openTime: openTime.trim(),
      closeTime: closeTime.trim(),
      location: coords,
      address,
    });

    Alert.alert("Creado", "Establecimiento agregado.");
    navigation.replace("establecimientoDetails", { id: created.id }); // ya queda en modo editar
    return;
  }

  // ✅ editar
  const updated = await svc.update(id, {
  nombre: nombre.trim(),
  direccion: direccion.trim() || undefined,
  photoUri,
  rating,
  games: selectedTitles,
  openTime: openTime.trim(),
  closeTime: closeTime.trim(),
  location: coords,
  address,
});


  if (updated) {
    Alert.alert("Guardado", "Cambios aplicados.");
    setItem(updated);
    setNombre(updated.nombre ?? "");
    setDireccion(updated.direccion ?? "");
  }
};


  const del = async () => {
    Alert.alert("Eliminar", "¿Borrar este establecimiento?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await svc.remove(id); navigation.goBack(); } }
    ]);
  };

  if (!item) return <View style={styles.container}><Text style={{ color: "#94a3b8" }}>Cargando…</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{id === 0 ? "Nuevo establecimiento" : item.nombre}</Text>

      <Text style={styles.blockTitle}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del establecimiento"
        placeholderTextColor="#9CA3AF"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={[styles.blockTitle, { marginTop: 10 }]}>Dirección</Text>
      <TextInput
        style={styles.input}
        placeholder="Dirección"
        placeholderTextColor="#9CA3AF"
        value={direccion}
        onChangeText={setDireccion}
      />

      {/* Foto */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Foto del local</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, { alignItems: "center", justifyContent: "center", borderColor: "#334155", borderWidth: 1 }]}>
            <Text style={{ color: "#94a3b8" }}>Sin imagen</Text>
          </View>
        )}
        <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
          <Text style={styles.btnTxt}>Elegir imagen</Text>
        </TouchableOpacity>
      </View>

      {/* Estrellas */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Calificación</Text>
        <Stars value={rating} onChange={setRating} />
      </View>

      {/* Juegos */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {gameIdx.map(g => {
        const active = selectedGameIds.includes(g.id);
        return (
          <TouchableOpacity
            key={g.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => toggleGame(g.id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {g.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>


      {/* Horario */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Horario</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Apertura (09:00)" placeholderTextColor="#9CA3AF" value={openTime} onChangeText={setOpenTime} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Cierre (21:00)" placeholderTextColor="#9CA3AF" value={closeTime} onChangeText={setCloseTime} />
        </View>
      </View>

      {/* Ubicación */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Ubicación (GPS)</Text>
        <Text style={{ color: "#cbd5e1", marginBottom: 4 }}>
        {coords ? `Lat: ${coords.lat.toFixed(6)}  Lng: ${coords.lng.toFixed(6)}`
          : "Sin ubicación guardada"}
        </Text>

      {!!address && (
        <Text style={{ color: "#94a3b8", marginBottom: 8 }}>
        {address}
        </Text>
      )}
        
        <TouchableOpacity style={styles.btnSecondary} onPress={getLocation}>
          <Text style={styles.btnTxt}>Usar mi ubicación actual</Text>
        </TouchableOpacity>
      </View>

      {/* Mini-mapa */}
      <View style={{ marginTop: 10, borderRadius: 12, overflow: "hidden" }}>
        <MapView
        style={{ width: "100%", height: 180 }}
        initialRegion={{
        latitude:  coords?.lat  ?? 19.432608,   // fallback CDMX
        longitude: coords?.lng  ?? -99.133209,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      region={
        coords
          ? { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
          : undefined
      }
      >
      {coords && (
      <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }}title={nombre || "Establecimiento"} />
        )}
      </MapView>
    </View>

    <TouchableOpacity
    style={[styles.btnSecondary, { marginTop: 10, alignItems: "center" }]}
    disabled={!coords}
    onPress={() => {
      if (!coords) return;
      const { lat, lng } = coords;
      const url =
        Platform.OS === "ios"
          ? `http://maps.apple.com/?ll=${lat},${lng}`
          : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(nombre || "Establecimiento")})`;
      Linking.openURL(url);
    }}
    >
    <Text style={styles.btnTxt}>{coords ? "Abrir en Mapas" : "Sin coordenadas"}</Text>
    </TouchableOpacity>


      {/* Botones */}
      <TouchableOpacity style={[styles.btn, { backgroundColor: "#3b82f6" }]} onPress={save}>
        <Text style={styles.btnTxt}>Guardar cambios</Text>
      </TouchableOpacity>

      {id !== 0 && (
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
  text:{ color:"#cbd5e1", marginTop:4 },
  block:{ marginTop:16 },
  blockTitle:{ color:"#e5e7eb", fontWeight:"700", marginBottom:8 },
  photo:{ width:"100%", height:180, borderRadius:12, backgroundColor:"#111827" },
  input:{
    backgroundColor:"#111827", color:"#e5e7eb",
    borderRadius:10, paddingHorizontal:12, paddingVertical:12,
    borderWidth:1, borderColor:"#1f2937"
  },
  btn:{ borderRadius:12, paddingVertical:14, alignItems:"center" },
  btnSecondary:{ borderRadius:12, paddingVertical:12, alignItems:"center", backgroundColor:"#1e293b", marginTop:8 },
  btnTxt:{ color:"#fff", fontWeight:"700" },

  chip:{ paddingVertical:8, paddingHorizontal:12, borderRadius:10, backgroundColor:"#111827", marginBottom:8, borderWidth:1, borderColor:"#1f2937" },
  chipActive:{ backgroundColor:"#1e293b", borderColor:"#3b82f6" },
  chipText:{ color:"#cbd5e1" },
  chipTextActive:{ color:"#93c5fd", fontWeight:"700" },
});
