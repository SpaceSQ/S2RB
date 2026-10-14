mod did;
mod mqtt;

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::io::Read;
use std::net::UdpSocket;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, State};

use crate::did::screen_did;
use crate::mqtt::{
    did_from_mail_topic, mail_topic, mqtt_connect, mqtt_ping, mqtt_publish, parse_publish, take_packet, MqttAuth,
    MAIL_FILTER,
};

const BEACON_PORT: u16 = 18840;

#[derive(Default, Clone, Serialize)]
struct MqttPulse {
    connected: bool,
    host: String,
    last_topic: String,
}

#[derive(Clone, Serialize, Deserialize)]
struct MailLetter {
    #[serde(rename = "toDid")]
    to_did: String,
    #[serde(rename = "fromDid")]
    from_did: String,
    body: String,
    #[serde(rename = "atMs")]
    at_ms: i64,
}

struct Store {
    db: Mutex<Connection>,
    mqtt: Mutex<MqttPulse>,
    hosts: Mutex<Vec<String>>,
    target: Mutex<Option<MqttAuth>>,
    inbox: Mutex<Vec<MailLetter>>,
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
    let hit = screen_did(&did).map_err(|reason| reason.as_str().to_string())?;
    store
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .execute("INSERT OR IGNORE INTO did_whitelist(did) VALUES (?1)", params![hit.clean])
        .map_err(|e| e.to_string())?;
    Ok(hit.clean)
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
    let hit = screen_did(&did).map_err(|reason| reason.as_str().to_string())?;
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
            params![hit.clean, host, now],
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
    store.mqtt.lock().map(|g| g.clone()).unwrap_or_default()
}

#[tauri::command]
fn discovered_hosts(store: State<Store>) -> Vec<String> {
    store.hosts.lock().map(|g| g.clone()).unwrap_or_default()
}

#[tauri::command]
fn mqtt_bind(host: String, username: String, password: String, store: State<Store>) -> Result<String, String> {
    let clean = host.trim();
    if clean.is_empty() {
        return Err("MQTT_HOST".into());
    }
    let user = if username.trim().is_empty() {
        "s2rb".into()
    } else {
        username.trim().to_string()
    };
    let pass = if password.is_empty() {
        "s2rb-local".into()
    } else {
        password
    };
    let auth = MqttAuth::new(clean.to_string(), user, pass);
    *store.target.lock().map_err(|e| e.to_string())? = Some(auth.clone());
    if let Ok(mut pulse) = store.mqtt.lock() {
        pulse.connected = false;
        pulse.host = auth.host.clone();
        pulse.last_topic = MAIL_FILTER.into();
    }
    Ok(auth.host)
}

#[tauri::command]
fn mail_list(store: State<Store>) -> Vec<MailLetter> {
    store.inbox.lock().map(|rows| rows.clone()).unwrap_or_default()
}

#[tauri::command]
fn mail_post(to_did: String, from_did: String, body: String, store: State<Store>) -> Result<u64, String> {
    let to = screen_did(&to_did).map_err(|reason| reason.as_str().to_string())?;
    let from = screen_did(&from_did).map_err(|reason| reason.as_str().to_string())?;
    let topic = mail_topic(&to.clean)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as i64;
    let letter = MailLetter {
        to_did: to.clean,
        from_did: from.clean,
        body,
        at_ms: now,
    };
    let payload = serde_json::to_vec(&letter).map_err(|e| e.to_string())?;
    let auth = store
        .target
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "MQTT_HOST".to_string())?;
    let mut stream = mqtt_connect(&auth)?;
    mqtt_publish(&mut stream, &topic, &payload)?;
    if let Ok(mut inbox) = store.inbox.lock() {
        inbox.insert(0, letter);
        inbox.truncate(50);
    }
    Ok(now as u64)
}

fn remember_letter(app: &AppHandle, topic: &str, payload: &[u8]) {
    let Some(to_did) = did_from_mail_topic(topic) else {
        return;
    };
    let letter = serde_json::from_slice::<MailLetter>(payload).ok().or_else(|| {
        Some(MailLetter {
            to_did,
            from_did: String::new(),
            body: String::from_utf8_lossy(payload).into_owned(),
            at_ms: 0,
        })
    });
    let Some(mut letter) = letter else { return };
    if screen_did(&letter.to_did).is_err() {
        return;
    }
    if !letter.from_did.is_empty() && screen_did(&letter.from_did).is_err() {
        return;
    }
    if let Some(store) = app.try_state::<Store>() {
        if let Ok(mut inbox) = store.inbox.lock() {
            if !inbox.iter().any(|row| row.at_ms == letter.at_ms && row.to_did == letter.to_did && row.body == letter.body) {
                if letter.at_ms == 0 {
                    letter.at_ms = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_millis() as i64)
                        .unwrap_or(0);
                }
                inbox.insert(0, letter);
                inbox.truncate(50);
            }
        }
        if let Ok(mut pulse) = store.mqtt.lock() {
            pulse.last_topic = topic.to_string();
        }
    }
}

fn mqtt_loop(app: AppHandle) {
    loop {
        let target = app
            .try_state::<Store>()
            .and_then(|store| store.target.lock().ok().and_then(|g| g.clone()));
        let Some(auth) = target else {
            std::thread::sleep(Duration::from_secs(1));
            continue;
        };
        match mqtt_connect(&auth) {
            Ok(mut stream) => {
                if let Some(store) = app.try_state::<Store>() {
                    if let Ok(mut pulse) = store.mqtt.lock() {
                        pulse.connected = true;
                        pulse.host = auth.host.clone();
                        pulse.last_topic = MAIL_FILTER.into();
                    }
                }
                let mut acc = Vec::new();
                let mut buf = [0u8; 2048];
                loop {
                    let still = app
                        .try_state::<Store>()
                        .and_then(|store| store.target.lock().ok().and_then(|g| g.as_ref().map(|t| t.host == auth.host)))
                        .unwrap_or(false);
                    if !still {
                        break;
                    }
                    match stream.read(&mut buf) {
                        Ok(0) => break,
                        Ok(n) => {
                            acc.extend_from_slice(&buf[..n]);
                            while let Some(packet) = take_packet(&mut acc) {
                                if let Some((topic, payload)) = parse_publish(&packet) {
                                    remember_letter(&app, &topic, &payload);
                                }
                            }
                        }
                        Err(err) if err.kind() == std::io::ErrorKind::TimedOut || err.kind() == std::io::ErrorKind::WouldBlock => {
                            let _ = mqtt_ping(&mut stream);
                        }
                        Err(_) => break,
                    }
                }
            }
            Err(_) => {
                if let Some(store) = app.try_state::<Store>() {
                    if let Ok(mut pulse) = store.mqtt.lock() {
                        pulse.connected = false;
                        pulse.host = auth.host;
                    }
                }
                std::thread::sleep(Duration::from_secs(2));
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
            discovered_hosts,
            mqtt_bind,
            mail_list,
            mail_post
        ])
        .setup(|app| {
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let conn = open_db(dir.join("s2rb.sqlite"))?;
            app.manage(Store {
                db: Mutex::new(conn),
                mqtt: Mutex::new(MqttPulse::default()),
                hosts: Mutex::new(Vec::new()),
                target: Mutex::new(None),
                inbox: Mutex::new(Vec::new()),
            });
            let handle = app.handle().clone();
            std::thread::spawn(move || udp_loop(handle));
            let mqtt_handle = app.handle().clone();
            std::thread::spawn(move || mqtt_loop(mqtt_handle));
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
