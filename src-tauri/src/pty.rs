use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};

pub struct PtySession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn portable_pty::Child + Send>,
}

impl PtySession {
    pub fn write_data(&mut self, data: &[u8]) -> Result<(), String> {
        self.writer.write_all(data).map_err(|e| e.to_string())?;
        self.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())
    }

    pub fn kill(&mut self) -> Result<(), String> {
        self.child.kill().map_err(|e| e.to_string())
    }
}

pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Spawns a shell for `session_id`. Returns `Ok(None)` if a session with
    /// that id already exists, so callers don't start a duplicate reader thread.
    /// Idempotency matters because React StrictMode mounts views twice in dev,
    /// and a second spawn would drop the live PTY — closing its master sends the
    /// shell EOF (a stray `^D`) and kicks off a restart loop.
    pub fn create_session(
        &self,
        session_id: &str,
        cwd: &str,
    ) -> Result<Option<Box<dyn Read + Send>>, String> {
        if self
            .sessions
            .lock()
            .map_err(|e| e.to_string())?
            .contains_key(session_id)
        {
            return Ok(None);
        }

        let pty_system = native_pty_system();

        let pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;

        let shell = detect_shell();
        let mut cmd = CommandBuilder::new(&shell);
        // Launch as interactive login shell so completion and profile load
        cmd.arg("-l");
        cmd.arg("-i");
        cmd.cwd(cwd);

        // Set TERM for proper terminal support
        cmd.env("TERM", "xterm-256color");
        // Disable macOS shell session save/restore
        cmd.env("SHELL_SESSIONS_DISABLE", "1");
        // Remove PREFIX to avoid nvm compatibility issues
        cmd.env_remove("PREFIX");

        let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

        let session = PtySession {
            master: pair.master,
            writer,
            child,
        };

        self.sessions
            .lock()
            .map_err(|e| e.to_string())?
            .insert(session_id.to_string(), session);

        Ok(Some(reader))
    }

    pub fn write_to_session(&self, session_id: &str, data: &[u8]) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session {} not found", session_id))?;
        session.write_data(data)
    }

    pub fn resize_session(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| format!("Session {} not found", session_id))?;
        session.resize(cols, rows)
    }

    pub fn close_session(&self, session_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        if let Some(mut session) = sessions.remove(session_id) {
            let _ = session.kill();
        }
        Ok(())
    }
}

fn detect_shell() -> String {
    if cfg!(target_os = "windows") {
        std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string())
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
    }
}
