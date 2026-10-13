import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Network from "expo-network";
import { DID, scanLan } from "./src/discover";

export default function App() {
  const [ip, setIp] = useState("");
  const [status, setStatus] = useState("接入家庭 Wi-Fi 后点扫描，手机会找 1884/lan。");
  const [hosts, setHosts] = useState([]);
  const [did, setDid] = useState("");
  const [list, setList] = useState([]);

  async function scan() {
    setStatus("正在嗅探局域网…");
    const nextIp = ip || (await Network.getIpAddressAsync().catch(() => "192.168.1.1"));
    setIp(nextIp);
    const found = await scanLan(nextIp);
    setHosts(found);
    setStatus(found.length ? `听到 ${found.length} 台 S2 Host` : "没有听到 Host。确认家里的 docker compose 已起来。");
  }

  function addDid() {
    const clean = did.trim().toUpperCase();
    if (!DID.test(clean)) {
      setStatus("DID 必须是 22 位大写字母或数字。白名单只留在这台手机上。");
      return;
    }
    if (!list.includes(clean)) setList([...list, clean]);
    setDid("");
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.body}>
      <StatusBar style="light" />
      <Text style={styles.mark}>S2RB · MOBILE</Text>
      <Text style={styles.title}>彩虹桥</Text>
      <Text style={styles.lead}>接入家庭 Wi-Fi 后自动找暴露 1883/1884 的 S2 Docker Host。成功握手才记，失败扫描不上云。</Text>
      <TextInput value={ip} onChangeText={setIp} placeholder="本机 IP（可留空）" placeholderTextColor="#7aa892" style={styles.input} />
      <Pressable style={styles.button} onPress={scan}><Text style={styles.buttonText}>扫描家庭网</Text></Pressable>
      <Text style={styles.hint}>{status}</Text>
      {hosts.map((item) => (
        <Pressable key={item.host} style={styles.card} onPress={() => Linking.openURL(`http://${item.host}:1884/cockpit`)}>
          <Text style={styles.cardTitle}>{item.host}</Text>
          <Text style={styles.hint}>MQTT {item.mqtt} · 驾驶舱 {item.cockpit}</Text>
        </Pressable>
      ))}
      <Text style={styles.sub}>本机 S2-DID 白名单</Text>
      <TextInput value={did} onChangeText={setDid} autoCapitalize="characters" maxLength={22} placeholder="22 位 S2-DID" placeholderTextColor="#7aa892" style={styles.input} />
      <Pressable style={styles.button} onPress={addDid}><Text style={styles.buttonText}>写入本机</Text></Pressable>
      {list.map((item) => <Text key={item} style={styles.hint}>{item}</Text>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#06110c" },
  body: { padding: 22, paddingTop: 64, gap: 10 },
  mark: { color: "#2ee6a6", letterSpacing: 2, fontSize: 12 },
  title: { color: "#d8ffe8", fontSize: 28, fontWeight: "600" },
  sub: { color: "#d8ffe8", fontSize: 16, marginTop: 16, fontWeight: "600" },
  lead: { color: "#7aa892", lineHeight: 20 },
  hint: { color: "#7aa892" },
  input: { borderColor: "#1f4a3a", borderWidth: 1, color: "#d8ffe8", padding: 10 },
  button: { backgroundColor: "#2ee6a6", padding: 12, alignItems: "center" },
  buttonText: { color: "#06110c", fontWeight: "700" },
  card: { borderColor: "#1f4a3a", borderWidth: 1, padding: 12 },
  cardTitle: { color: "#2ee6a6", fontSize: 16 },
});
