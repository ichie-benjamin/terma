use crate::config;
use crate::pty::PtyManager;
use std::io::Read;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn create_session(
    session_id: String,
    cwd: String,
    app: AppHandle,
    pty_manager: State<'_, PtyManager>,
) -> Result<String, String> {
    // Returns None if the session is already running (idempotent) — in that case
    // there's already a reader thread, so don't start another.
    if let Some(reader) = pty_manager.create_session(&session_id, &cwd)? {
        let event_name = format!("terminal-output-{}", session_id);
        let exit_event_name = format!("terminal-exit-{}", session_id);
        std::thread::spawn(move || {
            reader_thread(reader, app, event_name, exit_event_name);
        });
    }

    Ok(session_id)
}

fn reader_thread(mut reader: Box<dyn Read + Send>, app: AppHandle, event_name: String, exit_event_name: String) {
    // Output is coalesced and flushed on a fixed interval rather than emitted on
    // every read. A flooding command (large `cat`, build log, `yes`, …) can emit
    // thousands of reads per second; one IPC event each would back up the UI
    // thread and freeze the whole app — including the sidebar — for minutes.
    let pending: Arc<Mutex<Vec<u8>>> = Arc::new(Mutex::new(Vec::new()));
    let done = Arc::new(AtomicBool::new(false));

    let flush_pending = pending.clone();
    let flush_done = done.clone();
    let flush_app = app.clone();
    let flush_event = event_name.clone();
    let flusher = std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(8));
        let data = {
            let mut buf = flush_pending.lock().unwrap();
            std::mem::take(&mut *buf)
        };
        if !data.is_empty() {
            let _ = flush_app.emit(&flush_event, data);
        }
        if flush_done.load(Ordering::Acquire) {
            // Drain anything that arrived after the final take, then stop.
            let rest = std::mem::take(&mut *flush_pending.lock().unwrap());
            if !rest.is_empty() {
                let _ = flush_app.emit(&flush_event, rest);
            }
            break;
        }
    });

    let mut buf = [0u8; 8192];
    loop {
        match reader.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                if let Ok(mut p) = pending.lock() {
                    p.extend_from_slice(&buf[..n]);
                }
            }
            Err(_) => break,
        }
    }

    // Signal the flusher to drain and exit, then notify the frontend.
    done.store(true, Ordering::Release);
    let _ = flusher.join();
    let _ = app.emit(&exit_event_name, ());
}

#[tauri::command]
pub fn write_to_session(
    session_id: String,
    data: Vec<u8>,
    pty_manager: State<'_, PtyManager>,
) -> Result<(), String> {
    pty_manager.write_to_session(&session_id, &data)
}

#[tauri::command]
pub fn resize_session(
    session_id: String,
    cols: u16,
    rows: u16,
    pty_manager: State<'_, PtyManager>,
) -> Result<(), String> {
    pty_manager.resize_session(&session_id, cols, rows)
}

#[tauri::command]
pub fn close_session(
    session_id: String,
    pty_manager: State<'_, PtyManager>,
) -> Result<(), String> {
    // Closing a session discards its saved scrollback so it isn't restored later.
    let _ = config::delete_session_content(&session_id);
    pty_manager.close_session(&session_id)
}

#[tauri::command]
pub fn save_session_content(session_id: String, content: String) -> Result<(), String> {
    config::save_session_content(&session_id, &content)
}

#[tauri::command]
pub fn load_session_content(session_id: String) -> Result<Option<String>, String> {
    config::load_session_content(&session_id)
}

#[tauri::command]
pub fn load_config() -> Result<config::TermaConfig, String> {
    config::load_config()
}

#[tauri::command]
pub fn save_config(config: config::TermaConfig) -> Result<(), String> {
    config::save_config(&config)
}
