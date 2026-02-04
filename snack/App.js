import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function App() {
  // Put your deployed backend URL here later, e.g. https://xxxx.your-backend.com
  const [backendUrl, setBackendUrl] = useState("https://YOUR_BACKEND_URL");
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  async function pickFromGallery() {
    setResult(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setResult({ error: "Gallery permission denied" });
      return;
    }

    const chosen = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
    });

    if (chosen.canceled) return;

    const asset = chosen.assets[0];
    setPhotoUri(asset.uri);
    await analyze(asset.base64);
  }

  async function takePhoto() {
    setResult(null);

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setResult({ error: "Camera permission denied" });
      return;
    }

    const shot = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });

    if (shot.canceled) return;

    const asset = shot.assets[0];
    setPhotoUri(asset.uri);
    await analyze(asset.base64);
  }

  async function analyze(imageBase64) {
    if (!backendUrl || backendUrl.includes("YOUR_BACKEND_URL")) {
      setResult({ error: "Set your backend URL first (top input field)." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      setResult(data);

      setHistory((prev) => [
        { at: new Date().toISOString(), summary: data?.caption || "scan", data },
        ...prev,
      ].slice(0, 8));
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>AI Photo Scanner 📷🤖</Text>
        <Text style={styles.subtitle}>
          Pick/take photo → send to backend → AI returns caption + objects + OCR text
        </Text>

        <View style={styles.card}>
          <Text style={styles.h2}>Backend URL</Text>
          <TextInput
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="https://your-backend-url"
            style={styles.input}
            autoCapitalize="none"
          />
          <Text style={styles.gray}>
            Example: https://xxxx.pipedream.net or https://your-worker.yourname.workers.dev
          </Text>
        </View>

        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={takePhoto}>
            <Text style={styles.btnText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.btnAlt} onPress={pickFromGallery}>
            <Text style={styles.btnText}>Pick from Gallery</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={{ marginTop: 10 }}>
            <ActivityIndicator />
            <Text style={styles.gray}>Analyzing...</Text>
          </View>
        )}

        {photoUri && <Image source={{ uri: photoUri }} style={styles.image} />}

        <View style={styles.card}>
          <Text style={styles.h2}>AI Result</Text>
          <Text style={styles.mono}>
            {result ? JSON.stringify(result, null, 2) : "No result yet."}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>History</Text>
          {history.length === 0 ? (
            <Text style={styles.gray}>No scans yet.</Text>
          ) : (
            history.map((h, i) => (
              <View key={i} style={styles.histItem}>
                <Text style={styles.gray}>{h.at}</Text>
                <Text style={styles.white}>{h.summary}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  container: { padding: 16, gap: 12 },
  title: { color: "white", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#94a3b8", marginBottom: 6 },
  card: { backgroundColor: "#121a2a", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#22304a" },
  h2: { color: "white", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: "#0f172a", color: "white", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#22304a" },
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, backgroundColor: "#2b6cff", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnAlt: { flex: 1, backgroundColor: "#00b894", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },
  image: { width: "100%", height: 280, borderRadius: 12, marginTop: 10 },
  mono: { color: "#cbd5e1", fontFamily: "monospace", fontSize: 12 },
  gray: { color: "#94a3b8" },
  white: { color: "white" },
  histItem: { borderTopWidth: 1, borderTopColor: "#22304a", paddingTop: 8, marginTop: 8 }
});