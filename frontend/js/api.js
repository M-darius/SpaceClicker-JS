const API_BASE_URL = window.SPACE_CLICKER_API_URL || "http://localhost:3000/api";
const TOKEN_KEY = "space-clicker-token";
const USERNAME_KEY = "space-clicker-username";

export function getSession() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    username: localStorage.getItem(USERNAME_KEY)
  };
}

function saveSession({ token, username }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

async function request(path, options = {}) {
  // Point unique pour normaliser les erreurs API affichées dans l'interface.
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erreur réseau.");
  }

  return data;
}

export async function register(username, password) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  saveSession(data);
  return data;
}

export async function login(username, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  saveSession(data);
  return data;
}

export async function loadSave() {
  const { token } = getSession();
  if (!token) return null;

  return request("/save", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function saveGame(gameState) {
  const { token } = getSession();
  if (!token) {
    // Non connecté : pas de sauvegarde. La progression est perdue à la fermeture de l'onglet.
    return { message: "Connectez-vous pour sauvegarder votre progression." };
  }

  return request("/save", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gameState })
  });
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export async function fetchLeaderboard() {
  return request("/leaderboard");
}
