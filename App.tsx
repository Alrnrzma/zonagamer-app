// 📂 ARCHIVO: App.tsx
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import { initDb } from "./src/data/local/db";

// 👇 Importamos el proveedor desde la ruta correcta
import { AuthProvider } from "./src/context/AuthContext";

const App: React.FC = () => {
  useEffect(() => {
    (async () => {
      try {
        await initDb();
        console.log("✅ SQLite listo (zonagamer.db)");
      } catch (e) {
        console.log("❌ Error initDb:", e);
      }
    })();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
