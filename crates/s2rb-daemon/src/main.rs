use s2rb_daemon::{DaemonIpcCommand, S2rbLocalDaemon};
use std::collections::BTreeMap;

fn main() {
    let mut daemon = S2rbLocalDaemon::default();
    let mut chronicles = BTreeMap::new();
    let resp = daemon.handle_ipc(DaemonIpcCommand::PingHealth, &mut chronicles, 0);
    println!("[s2rbd v3.0.0] Sovereign Daemon Online -> {:?}", resp);
}
