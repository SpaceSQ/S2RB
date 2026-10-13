use rusqlite::{params, Connection};
use serde::Serialize;
use std::io::{Read, Write};
use std::net::{TcpStream, ToSocketAddrs, UdpSocket};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, State};

const BEACON_PORT: u16 = 18840;

#[derive(Default, Clone, Serialize)]
struct MqttPulse {
    connected: bool,
    host: String,
    last_topic: String,
}

struct Store {
    db: Mutex<Connection>,
    mqtt: Mutex<MqttPulse>,
    hosts: Mutex<Vec<String>>,
}

fn valid_did(did: &str) -> bool {
    did.len() == 22
        && did
            .chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit())
}

fn open_db(path: PathBuf) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS did_whitelist (
            did TEXT PRIMARY KEY CHECK(length(did) = 22)
         );
         CREATE TABLE IF NOT EXISTS handshakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            did TEXT NOT NULL,
            host TEXT NOT NULL,
            at_ms INTEGER NOT NULL,
            ok INTEGER NOT NULL CHECK(ok = 1)
         );",
    )
    .map_err(|e| e.to_string())?;
    Ok(conn)
}

#[tauri::command]
fn whitelist_add(did: String, store: State<Store>) -> Result<String, String> {
    let clean = did.trim().to_uppercase();
    if !valid_did(&clean) {
        return Err("DID_LENGTH".into());
    }
    store
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .execute("INSERT OR IGNORE INTO did_whitelist(did) VALUES (?1)", params![clean])
        .map_err(|e| e.to_string())?;
    Ok(clean)
}

#[tauri::command]
fn whitelist_list(store: State<Store>) -> Result<Vec<String>, String> {
    let db = store.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT did FROM did_whitelist ORDER BY did")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
fn handshake_record(did: String, host: String, store: State<Store>) -> Result<u64, String> {
    let clean = did.trim().to_uppercase();
    if !valid_did(&clean) {
        return Err("DID_LENGTH".into());
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as i64;
    store
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .execute(
            "INSERT INTO handshakes(did, host, at_ms, ok) VALUES (?1, ?2, ?3, 1)",
            params![clean, host, now],
        )
        .map_err(|e| e.to_string())?;
    Ok(now as u64)
}

#[derive(Serialize)]
struct HandshakeRow {
    did: String,
    host: String,
    at_ms: i64,
}

#[tauri::command]
fn handshake_list(store: State<Store>) -> Result<Vec<HandshakeRow>, String> {
    let db = store.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT did, host, at_ms FROM handshakes WHERE ok = 1 ORDER BY at_ms DESC LIMIT 50")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(HandshakeRow {
                did: row.get(0)?,
                host: row.get(1)?,
                at_ms: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
fn mqtt_status(store: State<Store>) -> MqttPulse {
    store
        .mqtt
        .lock()
        .map(|g| g.clone())
        .unwrap_or_default()
}

#[tauri::command]
fn discovered_hosts(store: State<Store>) -> Vec<String> {
    store
        .hosts
        .lock()
        .map(|g| g.clone())
        .unwrap_or_default()
}

fn remain(mut len: usize) -> Vec<u8> {
    let mut out = Vec::new();
    loop {
        let mut encoded = (len % 128) as u8;
        len /= 128;
        if len > 0 {
            encoded |= 0x80;
        }
        out.push(encoded);
        if len == 0 {
            break;
        }
    }
    out
}

fn mqtt_connect(host: &str) -> Result<TcpStream, String> {
    let addr = format!("{host}:1883")
        .to_socket_addrs()
        .map_err(|e| e.to_string())?
        .next()
        .ok_or_else(|| "MQTT_ADDR".to_string())?;
    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(3))
        .map_err(|e| e.to_string())?;
    stream
        .set_read_timeout(Some(Duration::from_secs(30)))
        .ok();
    let id = b"s2-desktop";
    let mut body = vec![0, 4];
    body.extend_from_slice(b"MQTT");
    body.push(4);
    body.push(0x02);
    body.extend_from_slice(&60u16.to_be_bytes());
    body.extend_from_slice(&(id.len() as u16).to_be_bytes());
    body.extend_from_slice(id);
    let mut pkt = vec![0x10];
    pkt.extend(remain(body.len()));
    pkt.extend(body);
    stream.write_all(&pkt).map_err(|e| e.to_string())?;
    let topic = b"S2/#";
    let mut sub = Vec::new();
    sub.extend_from_slice(&1u16.to_be_bytes());
    sub.extend_from_slice(&(topic.len() as u16).to_be_bytes());
    sub.extend_from_slice(topic);
    sub.push(0);
    let mut subpkt = vec![0x82];
    subpkt.extend(remain(sub.len()));
    subpkt.extend(sub);
    stream.write_all(&subpkt).map_err(|e| e.to_string())?;
    Ok(stream)
}

fn mqtt_loop(app: AppHandle, host: String) {
    match mqtt_connect(&host) {
        Ok(mut stream) => {
            if let Some(store) = app.try_state::<Store>() {
                if let Ok(mut pulse) = store.mqtt.lock() {
                    pulse.connected = true;
                    pulse.host = host.clone();
                }
            }
            let mut buf = [0u8; 2048];
            while let Ok(n) = stream.read(&mut buf) {
                if n == 0 {
                    break;
                }
                if let Some(store) = app.try_state::<Store>() {
                    if let Ok(mut pulse) = store.mqtt.lock() {
                        pulse.last_topic = format!("pulse:{n}");
                    }
                }
            }
        }
        Err(_) => {
            if let Some(store) = app.try_state::<Store>() {
                if let Ok(mut pulse) = store.mqtt.lock() {
                    pulse.connected = false;
                    pulse.host = host;
                }
            }
        }
    }
}

fn udp_loop(app: AppHandle) {
    let Ok(socket) = UdpSocket::bind(("0.0.0.0", BEACON_PORT)) else {
        return;
    };
    socket.set_read_timeout(Some(Duration::from_secs(5))).ok();
    let mut buf = [0u8; 512];
    loop {
        if let Ok((n, from)) = socket.recv_from(&mut buf) {
            let text = String::from_utf8_lossy(&buf[..n]);
            if text.contains("\"s2-aios\"") {
                let host = from.ip().to_string();
                if let Some(store) = app.try_state::<Store>() {
                    if let Ok(mut hosts) = store.hosts.lock() {
                        if !hosts.iter().any(|item| item == &host) {
                            hosts.push(host);
                        }
                    }
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            whitelist_add,
            whitelist_list,
            handshake_record,
            handshake_list,
            mqtt_status,
            discovered_hosts
        ])
        .setup(|app| {
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let conn = open_db(dir.join("s2rb.sqlite"))?;
            app.manage(Store {
                db: Mutex::new(conn),
                mqtt: Mutex::new(MqttPulse::default()),
                hosts: Mutex::new(Vec::new()),
            });
            let handle = app.handle().clone();
            std::thread::spawn(move || udp_loop(handle));
            let mqtt_handle = app.handle().clone();
            std::thread::spawn(move || mqtt_loop(mqtt_handle, "127.0.0.1".into()));
            let show = MenuItem::with_id(app, "show", "打开驾驶舱", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("desktop client");
}
