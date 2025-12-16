import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function Stars({
  value,
  onChange,
  size = 28,
}: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1,2,3,4,5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} style={{ padding: 4 }}>
          <MaterialIcons
            name={n <= value ? "star" : "star-border"}
            size={size}
            color={n <= value ? "#fbbf24" : "#94a3b8"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
