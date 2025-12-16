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


type Props = StackScreenProps<RootStackParamList, "establecimientoDetails">;

export default function EstablecimientoDetails({ route, navigation }: Props) {
  const { id } = route.params;
  const [item, setItem] = useState<svc.Establecimiento | null>(null);

  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [rating, setRating] = useState<number>(0);
  const [games, setGames] = useState<string>("");
  const [openTime, setOpenTime] = useState<string>("");
  const [closeTime, setCloseTime] = useState<string>("");
  const [coords, setCoords] = useState<{lat:number;lng:number} | undefined>();
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    (async () => {
      const it = await svc.getById(id);
      setItem(it ?? null);
      if (it) {
        setPhotoUri(it.photoUri);
        setRating(it.rating ?? 0);
        setGames((it.games ?? []).join(", "));
        setOpenTime(it.openTime ?? "");
        setCloseTime(it.closeTime ?? "");
        setCoords(it.location);
        setAddress(it.address ?? "");
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
  setAddress(pretty);             // 👈 guarda la dirección legible en estado
};


  const save = async () => {
    const gamesArr = games.split(",").map(s => s.trim()).filter(Boolean);
    const updated = await svc.update(id, {
      photoUri, rating, games: gamesArr,
      openTime: openTime.trim(), closeTime: closeTime.trim(),
      location: coords,
      address, 
    });
    if (updated) {
      Alert.alert("Guardado", "Cambios aplicados.");
      setItem(updated);
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
      <Text style={styles.title}>{item.nombre}</Text>
      {!!item.direccion && <Text style={styles.text}>{item.direccion}</Text>}

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
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Juegos disponibles</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: FIFA, Mortal Kombat, Street Fighter"
          placeholderTextColor="#9CA3AF"
          value={games}
          onChangeText={setGames}
        />
        <Text style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>Separa por comas.</Text>
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
      <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={item.nombre} />
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
          : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(item.nombre)})`;
      Linking.openURL(url);
    }}
    >
    <Text style={styles.btnTxt}>{coords ? "Abrir en Mapas" : "Sin coordenadas"}</Text>
    </TouchableOpacity>


      {/* Botones */}
      <TouchableOpacity style={[styles.btn, { backgroundColor: "#3b82f6" }]} onPress={save}>
        <Text style={styles.btnTxt}>Guardar cambios</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: "#ef4444", marginTop: 8 }]} onPress={del}>
        <Text style={styles.btnTxt}>Eliminar</Text>
      </TouchableOpacity>
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
});
