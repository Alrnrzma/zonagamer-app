import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as svc from "../../services/establecimientos.local";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

type Props = StackScreenProps<RootStackParamList, "establecimientoCreate">;

export default function EstablecimientoCreate({ navigation }: Props) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [address, setAddress] = useState<string>("");

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permiso", "Autoriza acceso a tu galería.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.length) setPhotoUri(res.assets[0].uri);
  };

  const pickLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permiso", "Ubicación denegada.");
    const loc = await Location.getCurrentPositionAsync({});
    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;
    setCoords({ lat, lng });

    // reverse geocode (dirección legible)
    const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const p = places[0];
    const pretty = p
      ? [
          p.street || p.name,
          p.streetNumber,
          p.subregion || p.city,
          p.region,
          p.postalCode,
          p.country,
        ].filter(Boolean).join(", ")
      : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    setAddress(pretty);
    if (!direccion.trim()) setDireccion(pretty);
  };

  const save = async () => {
    if (!nombre.trim()) return Alert.alert("Falta nombre", "Escribe el nombre del local.");
    const created = await svc.create({ nombre: nombre.trim(), direccion: direccion.trim() || undefined });
    // guarda extras (foto/coords/address) como patch
    await svc.update(created.id, {
      photoUri,
      location: coords,
      address: address || undefined,
    });
    Alert.alert("Creado", "Establecimiento agregado.");
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Nuevo establecimiento</Text>

      {/* Foto */}
      <View style={{ alignItems: "center", marginTop: 12 }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, { backgroundColor: "#111827", alignItems:"center", justifyContent:"center" }]}>
            <Text style={{ color:"#94a3b8" }}>Sin imagen</Text>
          </View>
        )}
        <TouchableOpacity style={styles.btnSecondary} onPress={pickPhoto}>
          <Text style={styles.btnTxt}>Elegir imagen</Text>
        </TouchableOpacity>
      </View>

      {/* Nombre */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Animatrix Zamora Local 1"
        placeholderTextColor="#9CA3AF"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Dirección (editable) */}
      <Text style={styles.label}>Dirección</Text>
      <TextInput
        style={styles.input}
        placeholder="Calle, número, ciudad..."
        placeholderTextColor="#9CA3AF"
        value={direccion}
        onChangeText={setDireccion}
      />

      {/* Ubicación */}
      <Text style={styles.label}>Ubicación (GPS)</Text>
      <Text style={{ color:"#cbd5e1" }}>
        {coords ? `Lat: ${coords.lat.toFixed(6)}  Lng: ${coords.lng.toFixed(6)}` : "Sin ubicación"}
      </Text>
      {!!address && <Text style={{ color:"#94a3b8", marginTop: 4 }}>{address}</Text>}

      <TouchableOpacity style={styles.btnSecondary} onPress={pickLocation}>
        <Text style={styles.btnTxt}>Usar mi ubicación actual</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={save}>
        <Text style={styles.btnTxt}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#0b0f1a" },
  title:{ color:"#fff", fontWeight:"800", fontSize:20 },
  photo:{ width: 180, height: 180, borderRadius: 16, marginBottom: 8 },
  label:{ color:"#cbd5e1", marginTop: 12, marginBottom: 6, fontWeight:"600" },
  input:{
    backgroundColor:"#111827", color:"#e5e7eb",
    borderRadius:10, paddingHorizontal:12, paddingVertical:12,
    borderWidth:1, borderColor:"#1f2937"
  },
  btn:{ backgroundColor:"#3b82f6", borderRadius:12, paddingVertical:14, alignItems:"center" },
  btnSecondary:{ backgroundColor:"#1e293b", borderRadius:12, paddingVertical:12, paddingHorizontal:16, marginTop:8 },
  btnTxt:{ color:"#fff", fontWeight:"700" },
});
