import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Admin from "./pages/Admin";

function App() {
  // ==========================================
  // USER / AUTHENTICATION STATE
  // ==========================================

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    // No valid login information
    if (!savedUser || !token) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Invalid saved user:", error);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      return null;
    }
  });

  // ==========================================
  // AUTH PAGE
  // ==========================================

  const [authPage, setAuthPage] = useState("login");

  // ==========================================
  // APPLICATION PAGE
  // ==========================================

  const [currentPage, setCurrentPage] = useState("notes");

  // ==========================================
  // LOGIN / REGISTER SUCCESS
  // ==========================================

  const handleLogin = (data) => {
    if (!data || !data.token || !data.user) {
      console.error("Invalid authentication response:", data);
      return;
    }

    // Save JWT
    localStorage.setItem("token", data.token);

    // Save user information
    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    // Update React state immediately
    setUser(data.user);

    // Decide which page to show
    if (data.user.role === "admin") {
      setCurrentPage("admin");
    } else {
      setCurrentPage("notes");
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setAuthPage("login");
    setCurrentPage("notes");
  };

  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!user) {
    // Registration page
    if (authPage === "register") {
      return (
        <Register
          onRegister={handleLogin}
          onSwitchToLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    // Login page
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() =>
          setAuthPage("register")
        }
      />
    );
  }

  // ==========================================
  // ADMIN
  // ==========================================

  if (
    user.role === "admin" &&
    currentPage === "admin"
  ) {
    return (
      <Admin
        user={user}
        onBack={() =>
          setCurrentPage("notes")
        }
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // NORMAL USER / NOTES
  // ==========================================

  return (
    <Notes
      user={user}
      onLogout={handleLogout}
      onOpenAdmin={() =>
        setCurrentPage("admin")
      }
    />
  );
}

export default App;