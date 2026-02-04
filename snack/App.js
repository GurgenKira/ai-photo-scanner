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
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function App() {
  const [backendUrl, setBackendUrl] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const img = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.6,
    });
    if (img.canceled) return;
    const a = img.assets[0];
    setPhotoUri(a.uri);
    analyze(a.base64, a.mimeType);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const img = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.6,
    });
    if (img.canceled) return;
    const a = img.assets[0];
    setPhotoUri(a.uri);
    analyze(a.base64, a.mimeType);
  }

  async function analyze(imageBase64, mimeType) {
    if (!backendUrl) {
      setResult({ error: "Backend URL missing" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      const txt = await res.text();
      let data;
      try {
        data = JSON.parse(txt);
      } catch {
        data = { error: "Invalid JSON", raw: txt };
      }

      setResult(data);
      setHistory((h) =>
        [
          { at: new Date().toISOString(), summary: data.caption || "scan" },
          ...h,
        ].slice(0, 10)
      );
    } catch (e) {
      setResult({ error: String(e) });
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>AI Photo Scanner</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="https://xxxx.m.pipedream.net"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={takePhoto}>
            <Text style={styles.btnText}>Take Photo</Text>
          </Pressable>

          <Pressable style={styles.btnAlt} onPress={pickFromGallery}>
            <Text style={styles.btnText}>Pick</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator />}

        {photoUri && <Image source={{ uri: photoUri }} style={styles.image} />}

        <View style={styles.card}>
          <Text style={styles.label}>AI Result</Text>
          <Text style={styles.result}>
            {result ? JSON.stringify(result, null, 2) : "None"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>History</Text>
          {history.map((h, i) => (
            <Text key={i} style={styles.historyItem}>
              {h.at} — {h.summary}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  container: { padding: 16, gap: 12 },
  title: { color: "white", fontSize: 24, fontWeight: "700" },
  card: {
    backgroundColor: "#121a2a",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22304a",
  },
  label: { color: "white", marginBottom: 6 },
  input: {
    backgroundColor: "#0f172a",
    color: "white",
    padding: 10,
    borderRadius: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    backgroundColor: "#2b6cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnAlt: {
    flex: 1,
    backgroundColor: "#00b894",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "700" },
  image: { width: "100%", height: 300, borderRadius: 12 },
  result: { color: "#ccc", fontFamily: "monospace", fontSize: 12 },
  historyItem: { color: "#ccc", marginTop: 2 },
});