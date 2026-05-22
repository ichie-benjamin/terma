use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TermaConfig {
    pub version: u32,
    pub projects: Vec<Project>,
    pub settings: AppSettings,
    pub window: WindowState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub sessions: Vec<Session>,
    pub collapsed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shell: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub font_family: String,
    pub font_size: u32,
    pub line_height: f64,
    pub cursor_style: String,
    pub cursor_blink: bool,
    pub scrollback: u32,
    pub default_shell: Option<String>,
    pub sidebar_width: u32,
    pub confirm_on_close: bool,
    pub restore_on_startup: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub maximized: bool,
}

fn config_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".terma")
}

fn config_path() -> PathBuf {
    config_dir().join("config.json")
}

fn sessions_dir() -> PathBuf {
    config_dir().join("sessions")
}

fn session_content_path(session_id: &str) -> PathBuf {
    // Session ids are uuids; strip anything but safe chars defensively so a
    // crafted id can't escape the sessions directory.
    let safe: String = session_id
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    sessions_dir().join(format!("{}.log", safe))
}

pub fn save_session_content(session_id: &str, content: &str) -> Result<(), String> {
    fs::create_dir_all(sessions_dir()).map_err(|e| e.to_string())?;
    fs::write(session_content_path(session_id), content).map_err(|e| e.to_string())
}

pub fn load_session_content(session_id: &str) -> Result<Option<String>, String> {
    let path = session_content_path(session_id);
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(&path).map(Some).map_err(|e| e.to_string())
}

pub fn delete_session_content(session_id: &str) -> Result<(), String> {
    let path = session_content_path(session_id);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

impl Default for TermaConfig {
    fn default() -> Self {
        Self {
            version: 1,
            projects: vec![],
            settings: AppSettings {
                theme: "dark".to_string(),
                font_family: "JetBrains Mono, Menlo, monospace".to_string(),
                font_size: 14,
                line_height: 1.2,
                cursor_style: "block".to_string(),
                cursor_blink: true,
                scrollback: 5000,
                default_shell: None,
                sidebar_width: 240,
                confirm_on_close: true,
                restore_on_startup: true,
            },
            window: WindowState {
                width: 1200,
                height: 800,
                x: 100,
                y: 100,
                maximized: false,
            },
        }
    }
}

pub fn load_config() -> Result<TermaConfig, String> {
    let path = config_path();
    if !path.exists() {
        let config = TermaConfig::default();
        save_config(&config)?;
        return Ok(config);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let config: TermaConfig = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(config)
}

pub fn save_config(config: &TermaConfig) -> Result<(), String> {
    let dir = config_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(config_path(), content).map_err(|e| e.to_string())?;
    Ok(())
}
