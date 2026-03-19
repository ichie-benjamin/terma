use crate::config;
use crate::pty::PtyManager;
use std::io::Read;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn create_session(
    session_id: String,
    cwd: String,
    app: AppHandle,
    pty_manager: State<'_, PtyManager>,
) -> Result<String, String> {
    let reader = pty_manager.create_session(&session_id, &cwd)?;

    // Spawn a thread to read PTY output and emit events
    let event_name = format!("terminal-output-{}", session_id);
    let exit_event_name = format!("terminal-exit-{}", session_id);
    std::thread::spawn(move || {
        reader_thread(reader, app, event_name, exit_event_name);
    });

    Ok(session_id)
}

fn reader_thread(mut reader: Box<dyn Read + Send>, app: AppHandle, event_name: String, exit_event_name: String) {
    let mut buf = [0u8; 4096];
    loop {
        match reader.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                let data = &buf[..n];
                // Send as Vec<u8> for binary safety
                let _ = app.emit(&event_name, data.to_vec());
            }
            Err(_) => break,
        }
    }
    // Notify frontend that the PTY session has ended
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
    pty_manager.close_session(&session_id)
}

#[tauri::command]
pub fn load_config() -> Result<config::TermaConfig, String> {
    config::load_config()
}

#[tauri::command]
pub fn save_config(config: config::TermaConfig) -> Result<(), String> {
    config::save_config(&config)
}
