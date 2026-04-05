// ──────────────────────────────────────────
// LocalPilot — English Translations
// ──────────────────────────────────────────

const en = {
  // ── App ──
  app: {
    name: 'LocalPilot',
    tagline: 'Your local AI control center',
  },

  // ── Navigation ──
  nav: {
    home: 'Home',
    chat: 'Chat',
    projects: 'Projects',
    prompts: 'Prompts',
    documents: 'Documents',
    tools: 'Tools',
    settings: 'Settings',
    overlay: 'Quick Access',
  },

  // ── Common ──
  common: {
    create: 'Create',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    copy: 'Copy',
    copied: 'Copied!',
    loading: 'Loading...',
    noResults: 'No results found',
    confirm: 'Confirm',
    back: 'Back',
    more: 'More',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    pin: 'Pin',
    unpin: 'Unpin',
    rename: 'Rename',
    send: 'Send',
    clear: 'Clear',
    reset: 'Reset',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    untitled: 'Untitled',
    general: 'General',
    actions: 'Actions',
    description: 'Description',
    title: 'Title',
    name: 'Name',
    content: 'Content',
    category: 'Category',
    tags: 'Tags',
    model: 'Model',
    created: 'Created',
    updated: 'Updated',
    selectModel: 'Select model',
    noModel: 'No model selected',
  },

  // ── Home ──
  home: {
    welcome: 'Welcome back',
    welcomeSub: 'Your local AI workspace is ready.',
    recentChats: 'Recent Chats',
    recentProjects: 'Recent Projects',
    favoritePrompts: 'Favorite Prompts',
    quickActions: 'Quick Actions',
    ollamaStatus: 'Ollama Status',
    modelsAvailable: 'Models Available',
    newChat: 'New Chat',
    newProject: 'New Project',
    newPrompt: 'New Prompt',
    newDocument: 'New Document',
    viewAll: 'View all',
    noRecentChats: 'No recent chats yet',
    noRecentProjects: 'No projects yet',
    noFavoritePrompts: 'No favorite prompts yet',
    continueWork: 'Continue where you left off',
    documentsSnapshot: 'Documents',
    noDocuments: 'No documents yet',
  },

  // ── Chat ──
  chat: {
    newChat: 'New Chat',
    conversations: 'Conversations',
    typeMessage: 'Type your message...',
    sendMessage: 'Send message',
    selectChat: 'Select a conversation',
    selectChatSub: 'Choose an existing conversation or start a new one.',
    deleteChat: 'Delete conversation?',
    deleteChatConfirm: 'This will permanently delete this conversation and all its messages.',
    renameChat: 'Rename conversation',
    systemPrompt: 'System prompt',
    systemPromptPlaceholder: 'Set a custom system prompt for this chat...',
    attachPrompt: 'Use prompt template',
    noChats: 'No conversations yet',
    noChatsHint: 'Start a new conversation to begin.',
    thinking: 'Thinking...',
    errorGenerate: 'Failed to generate response. Please check your Ollama connection.',
    copyCode: 'Copy code',
    pinned: 'Pinned',
    all: 'All',
    searchChats: 'Search conversations...',
  },

  // ── Projects ──
  projects: {
    title: 'Projects',
    newProject: 'New Project',
    editProject: 'Edit Project',
    deleteProject: 'Delete project?',
    deleteProjectConfirm: 'This will permanently delete this project. Linked items will not be deleted.',
    noProjects: 'No projects yet',
    noProjectsHint: 'Create a project to organize your work.',
    linkedChats: 'Linked Chats',
    linkedPrompts: 'Linked Prompts',
    linkedDocuments: 'Linked Documents',
    preferredModel: 'Preferred Model',
    projectColor: 'Color',
    projectIcon: 'Icon',
    addLink: 'Link item',
  },

  // ── Prompts ──
  prompts: {
    title: 'Prompt Library',
    newPrompt: 'New Prompt',
    editPrompt: 'Edit Prompt',
    deletePrompt: 'Delete prompt?',
    deletePromptConfirm: 'This will permanently delete this prompt template.',
    noPrompts: 'No prompts yet',
    noPromptsHint: 'Create reusable prompt templates for your workflows.',
    useInChat: 'Use in new chat',
    searchPrompts: 'Search prompts...',
    categories: 'Categories',
    allCategories: 'All categories',
    promptContent: 'Prompt content',
    promptContentPlaceholder: 'Write your prompt template here...',
    addTag: 'Add tag',
    favorites: 'Favorites',
  },

  // ── Documents ──
  documents: {
    title: 'Documents',
    newDocument: 'New Document',
    editDocument: 'Edit Document',
    deleteDocument: 'Delete document?',
    deleteDocumentConfirm: 'This will permanently delete this document.',
    noDocuments: 'No documents yet',
    noDocumentsHint: 'Create or import text documents.',
    importText: 'Import text',
    contentPlaceholder: 'Start writing or paste text here...',
    aiActions: 'AI Actions',
    summarize: 'Summarize',
    rewrite: 'Rewrite',
    explain: 'Explain',
    toBullets: 'Turn into bullets',
    searchDocuments: 'Search documents...',
    linkedProject: 'Linked project',
  },

  // ── Tools ──
  tools: {
    title: 'Quick Tools',
    run: 'Run',
    running: 'Running...',
    result: 'Result',
    copyResult: 'Copy result',
    sendToChat: 'Send to chat',
    saveAsDocument: 'Save as document',
    inputPlaceholder: 'Enter your text here...',
    noResult: 'Run the tool to see results.',
    targetLanguage: 'Target language',

    summarize: 'Summarize Text',
    summarizeDesc: 'Get a concise summary of any text.',
    rewrite: 'Rewrite Text',
    rewriteDesc: 'Rewrite text to improve clarity and style.',
    translate: 'Translate Text',
    translateDesc: 'Translate text to another language.',
    explain: 'Explain Simply',
    explainDesc: 'Break down complex text into simple language.',
    email: 'Generate Email',
    emailDesc: 'Generate a professional email from a brief description.',
    social: 'Generate Social Post',
    socialDesc: 'Create engaging social media content.',
    cleanup: 'Clean Up Notes',
    cleanupDesc: 'Organize and clean up rough notes.',
  },

  // ── Overlay ──
  overlay: {
    title: 'Quick Access',
    quickInput: 'Ask anything...',
    selectTool: 'Select tool',
    openFull: 'Open in full app',
    close: 'Close overlay',
  },

  // ── Settings ──
  settings: {
    title: 'Settings',
    language: 'Language',
    languageDesc: 'Choose your preferred language.',
    theme: 'Theme',
    themeDesc: 'Switch between light and dark mode.',
    light: 'Light',
    dark: 'Dark',
    defaultModel: 'Default Model',
    defaultModelDesc: 'The model used by default for new chats and tools.',
    ollamaUrl: 'Ollama Base URL',
    ollamaUrlDesc: 'The base URL for your local Ollama instance.',
    storage: 'Storage',
    storageDesc: 'Local data is stored in your app data directory.',
    resetData: 'Reset All Data',
    resetDataDesc: 'Delete all local data including chats, projects, prompts, and documents.',
    resetDataConfirm: 'Are you sure? This action cannot be undone.',
    appInfo: 'About LocalPilot',
    version: 'Version',
    about: 'A premium local AI control center powered by Ollama.',
    english: 'English',
    swedish: 'Swedish',
    appearance: 'Appearance',
    connection: 'Connection',
    data: 'Data & Storage',
    restart: 'Restart App',
    restartTooltip: 'Restart the entire application',
    restartConfirmTitle: 'Restart LocalPilot?',
    restartConfirmDesc: 'This will close and restart the application. Unsaved state may be lost.',
    restartConfirmBtn: 'Yes, restart now',
  },

  // ── Ollama ──
  ollama: {
    connected: 'Connected',
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    noModels: 'No models available',
    loadingModels: 'Loading models...',
    connectionError: 'Cannot connect to Ollama',
    connectionErrorHint: 'Make sure Ollama is running at',
    modelNotFound: 'Model not found',
    generationError: 'Generation failed',
  },

  // ── Errors ──
  errors: {
    generic: 'Something went wrong',
    tryAgain: 'Try again',
    notFound: 'Not found',
  },

  // ── Delete confirmation ──
  deleteConfirm: {
    title: 'Are you sure?',
    cancel: 'Cancel',
    confirm: 'Delete',
  },
};

// Deep type that preserves structure but uses string values (not literals)
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type TranslationKeys = DeepStringify<typeof en>;
export default en as TranslationKeys;
