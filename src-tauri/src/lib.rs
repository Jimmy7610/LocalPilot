use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: "
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    model TEXT NOT NULL DEFAULT '',
                    system_prompt TEXT DEFAULT '',
                    pinned INTEGER DEFAULT 0,
                    project_id TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    color TEXT NOT NULL DEFAULT '#6366f1',
                    icon TEXT NOT NULL DEFAULT 'folder',
                    preferred_model TEXT DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS prompts (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    category TEXT DEFAULT 'general',
                    tags TEXT DEFAULT '[]',
                    content TEXT NOT NULL,
                    favorite INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT DEFAULT '',
                    project_id TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS project_prompts (
                    project_id TEXT NOT NULL,
                    prompt_id TEXT NOT NULL,
                    PRIMARY KEY (project_id, prompt_id)
                );

                CREATE TABLE IF NOT EXISTS project_documents (
                    project_id TEXT NOT NULL,
                    document_id TEXT NOT NULL,
                    PRIMARY KEY (project_id, document_id)
                );

                CREATE TABLE IF NOT EXISTS project_chats (
                    project_id TEXT NOT NULL,
                    chat_id TEXT NOT NULL,
                    PRIMARY KEY (project_id, chat_id)
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add custom_tools table",
            sql: "
                CREATE TABLE IF NOT EXISTS custom_tools (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    icon TEXT NOT NULL,
                    system_prompt TEXT NOT NULL,
                    input_placeholder TEXT,
                    has_target_language INTEGER DEFAULT 0,
                    is_custom INTEGER DEFAULT 1
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add workspace RAG support",
            sql: "
                ALTER TABLE projects ADD COLUMN workspace_path TEXT;
                
                CREATE TABLE IF NOT EXISTS workspace_files (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    path TEXT NOT NULL,
                    last_modified TEXT,
                    size INTEGER,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS workspace_chunks (
                    id TEXT PRIMARY KEY,
                    file_id TEXT NOT NULL,
                    project_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    index_order INTEGER,
                    FOREIGN KEY (file_id) REFERENCES workspace_files(id) ON DELETE CASCADE,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add message type and metadata",
            sql: "
                ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text';
                ALTER TABLE messages ADD COLUMN meta TEXT;
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:localpilot.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
