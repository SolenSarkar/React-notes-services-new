import { useCallback, useEffect, useState } from "react";
import Pagination from "../components/Pagination";
import toast from "react-hot-toast";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function Admin({ user, onBack, onLogout }) {
  // =====================================================
  // STATE
  // =====================================================

  const [activeTab, setActiveTab] = useState("dashboard");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalAdmins: 0,
    totalRegularUsers: 0,
  });

  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);

  const [userSearchInput, setUserSearchInput] =
    useState("");

  const [userSearch, setUserSearch] =
    useState("");

  const [noteSearchInput, setNoteSearchInput] =
    useState("");

  const [noteSearch, setNoteSearch] =
    useState("");

  const [userPage, setUserPage] = useState(1);
  const [notePage, setNotePage] = useState(1);

  // Admin notes: 9 notes per page
  const [noteLimit] = useState(9);

  // Admin users: 10 users per page
  const [userLimit] = useState(10);

  const [userPagination, setUserPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [notePagination, setNotePagination] =
    useState({
      page: 1,
      limit: 9,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [loadingStats, setLoadingStats] =
    useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [loadingNotes, setLoadingNotes] =
    useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // COMMON AUTH HEADERS
  // =====================================================

  const getHeaders = () => {
    const token = getToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // =====================================================
  // LOAD STATS
  // =====================================================

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/stats`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          onLogout();
          return;
        }

        throw new Error(
          data.message ||
            "Failed to load dashboard statistics"
        );
      }

      setStats({
        totalUsers: data.totalUsers || 0,
        totalNotes: data.totalNotes || 0,
        totalAdmins: data.totalAdmins || 0,
        totalRegularUsers:
          data.totalRegularUsers || 0,
      });
    } catch (err) {
      console.error("Admin stats error:", err);

      setError(
        err.message ||
          "Failed to load dashboard statistics"
      );
    } finally {
      setLoadingStats(false);
    }
  }, [onLogout]);

  // =====================================================
  // LOAD USERS
  // =====================================================

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const params = new URLSearchParams({
        page: String(userPage),
        limit: String(userLimit),
      });

      if (userSearch.trim()) {
        params.append(
          "search",
          userSearch.trim()
        );
      }

      const response = await fetch(
        `${API_URL}/api/admin/users?${params.toString()}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          onLogout();
          return;
        }

        throw new Error(
          data.message ||
            "Failed to load users"
        );
      }

      setUsers(
        Array.isArray(data.users)
          ? data.users
          : []
      );

      setUserPagination(
        data.pagination || {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      console.error("Admin users error:", err);

      setError(
        err.message ||
          "Failed to load users"
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [
    userPage,
    userSearch,
    userLimit,
    onLogout,
  ]);

  // =====================================================
  // LOAD NOTES
  // =====================================================

  const fetchNotes = useCallback(async () => {
    try {
      setLoadingNotes(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const params = new URLSearchParams({
        page: String(notePage),
        limit: String(noteLimit),
      });

      if (noteSearch.trim()) {
        params.append(
          "search",
          noteSearch.trim()
        );
      }

      const response = await fetch(
        `${API_URL}/api/admin/notes?${params.toString()}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          onLogout();
          return;
        }

        throw new Error(
          data.message ||
            "Failed to load admin notes"
        );
      }

      setNotes(
        Array.isArray(data.notes)
          ? data.notes
          : []
      );

      setNotePagination(
        data.pagination || {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      console.error("Admin notes error:", err);

      setError(
        err.message ||
          "Failed to load notes"
      );
    } finally {
      setLoadingNotes(false);
    }
  }, [
    notePage,
    noteSearch,
    noteLimit,
    onLogout,
  ]);

  // =====================================================
  // INITIAL DASHBOARD LOAD
  // =====================================================

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // =====================================================
  // LOAD USERS WHEN USERS TAB IS OPENED
  // =====================================================

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // =====================================================
  // LOAD NOTES WHEN NOTES TAB IS OPENED
  // =====================================================

  useEffect(() => {
    if (activeTab === "notes") {
      fetchNotes();
    }
  }, [activeTab, fetchNotes]);

  // =====================================================
  // USER SEARCH
  // =====================================================

  const handleUserSearch = (e) => {
    e.preventDefault();

    setUserPage(1);
    setUserSearch(userSearchInput);
  };

  const clearUserSearch = () => {
    setUserSearchInput("");
    setUserSearch("");
    setUserPage(1);
  };

  // =====================================================
  // NOTE SEARCH
  // =====================================================

  const handleNoteSearch = (e) => {
    e.preventDefault();

    setNotePage(1);
    setNoteSearch(noteSearchInput);
  };

  const clearNoteSearch = () => {
    setNoteSearchInput("");
    setNoteSearch("");
    setNotePage(1);
  };

  // =====================================================
  // DELETE NOTE
  // =====================================================

  const handleDeleteNote = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/notes/${noteId}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          onLogout();
          return;
        }

        throw new Error(
          data.message ||
            "Failed to delete note"
        );
      }

      // Remove from current list immediately
      setNotes((currentNotes) =>
        currentNotes.filter(
          (note) => note._id !== noteId
        )
      );

      // Update totals
      setStats((currentStats) => ({
        ...currentStats,
        totalNotes: Math.max(
          0,
          currentStats.totalNotes - 1
        ),
      }));

      setNotePagination(
        (currentPagination) => ({
          ...currentPagination,
          total: Math.max(
            0,
            currentPagination.total - 1
          ),
        })
      );

      setError("");
      toast.success("Note removed successfully");
    } catch (err) {
      console.error(
        "Admin delete note error:",
        err
      );

      const message =
        err.message || "Failed to delete note";

      setError(message);
      toast.error(message);
    }
  };

  // =====================================================
  // ACCESS PROTECTION
  // =====================================================

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-page">
        <main className="admin-access-denied">
          <h2>Access Denied</h2>

          <p>
            You must be an administrator to
            access this page.
          </p>

          <button
            type="button"
            onClick={onBack}
          >
            Back to Notes
          </button>
        </main>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="admin-header">
        <div>
          <h1>🛡️ Admin Dashboard</h1>

          <p>
            Welcome,{" "}
            <strong>
              {user.name || user.email}
            </strong>
          </p>
        </div>

        <div className="admin-header-actions">

          <button
            type="button"
            onClick={onBack}
          >
            My Notes
          </button>

          <button
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>
      </header>

      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <nav className="admin-nav">

        <button
          type="button"
          className={
            activeTab === "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          type="button"
          className={
            activeTab === "users"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("users")
          }
        >
          Users
        </button>

        <button
          type="button"
          className={
            activeTab === "notes"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("notes")
          }
        >
          Notes
        </button>

      </nav>

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="notes-error">
          {error}
        </div>
      )}

      <main className="admin-content">

        {/* ========================================
            DASHBOARD TAB
        ======================================== */}

        {activeTab === "dashboard" && (
          <section>

            <div className="admin-section-title">
              <h2>Overview</h2>

              <button
                type="button"
                onClick={() => {
                  fetchStats();
                  fetchUsers();
                  fetchNotes();
                }}
              >
                Refresh
              </button>
            </div>

            {loadingStats ? (
              <div className="admin-loading-container">
                <div className="admin-spinner"></div>
                <p>Loading statistics...</p>
              </div>
            ) : (
              <div className="admin-stats-grid">

                <div className="admin-stat-card">
                  <span>Total Users</span>
                  <strong>
                    {stats.totalUsers}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>Total Notes</span>
                  <strong>
                    {stats.totalNotes}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>Administrators</span>
                  <strong>
                    {stats.totalAdmins}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>Regular Users</span>
                  <strong>
                    {stats.totalRegularUsers}
                  </strong>
                </div>

              </div>
            )}

            <div className="admin-welcome-card">

              <h2>
                Welcome to the Admin Panel
              </h2>

              <p>
                From here you can monitor
                users and moderate notes
                across the React Notes
                Services platform.
              </p>

            </div>

          </section>
        )}

        {/* ========================================
            USERS TAB
        ======================================== */}

        {activeTab === "users" && (
          <section>

            <div className="admin-section-title">
              <div>
                <h2>User Management</h2>

                <p>
                  View registered users
                  and their roles.
                </p>
              </div>
            </div>

            <form
              className="search-form"
              onSubmit={handleUserSearch}
            >

              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearchInput}
                onChange={(e) =>
                  setUserSearchInput(
                    e.target.value
                  )
                }
              />

              <button type="submit">
                Search
              </button>

              {userSearch && (
                <button
                  type="button"
                  onClick={clearUserSearch}
                >
                  Clear
                </button>
              )}

            </form>

            <div className="admin-summary">
              Total users:{" "}
              {userPagination.total}
            </div>

            {loadingUsers ? (
              <div className="admin-loading-container">
                <div className="admin-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-notes">
                <h3>No users found</h3>
              </div>
            ) : (
              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>

                    {users.map((item) => (
                      <tr key={item._id}>

                        <td>
                          {item.name}
                        </td>

                        <td>
                          {item.email}
                        </td>

                        <td>
                          <span
                            className={`role-badge ${item.role}`}
                          >
                            {item.role}
                          </span>
                        </td>

                        <td>
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}

            <Pagination
              page={userPagination.page}
              totalPages={
                userPagination.totalPages
              }
              hasNextPage={
                userPagination.hasNextPage
              }
              hasPreviousPage={
                userPagination.hasPreviousPage
              }
              onPageChange={(newPage) => {
                setUserPage(newPage);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            />

          </section>
        )}

        {/* ========================================
            NOTES TAB
        ======================================== */}

        {activeTab === "notes" && (
          <section>

            <div className="admin-section-title">
              <div>
                <h2>Notes Management</h2>

                <p>
                  View and moderate all
                  notes created by users.
                </p>
              </div>
            </div>

            <form
              className="search-form"
              onSubmit={handleNoteSearch}
            >

              <input
                type="text"
                placeholder="Search all notes..."
                value={noteSearchInput}
                onChange={(e) =>
                  setNoteSearchInput(
                    e.target.value
                  )
                }
              />

              <button type="submit">
                Search
              </button>

              {noteSearch && (
                <button
                  type="button"
                  onClick={clearNoteSearch}
                >
                  Clear
                </button>
              )}

            </form>

            <div className="admin-summary">
              Total notes:{" "}
              {notePagination.total}
            </div>

            {loadingNotes ? (
              <div className="admin-loading-container">
                <div className="admin-spinner"></div>
                <p>Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="empty-notes">
                <h3>No notes found</h3>
              </div>
            ) : (
              <div className="notes-list">

                {notes.map((note) => (
                  <div
                    className="note-card admin-note-card"
                    key={note._id}
                  >

                    <div className="note-card-content">

                      <h3>
                        {note.title}
                      </h3>

                      <p>
                        {note.content}
                      </p>

                      <div className="note-owner">

                        <strong>
                          Owner:
                        </strong>{" "}

                        {note.user?.name ||
                          "Unknown"}

                        {" — "}

                        {note.user?.email ||
                          "Unknown"}

                      </div>

                      <small>
                        Created:{" "}
                        {note.createdAt
                          ? new Date(
                              note.createdAt
                            ).toLocaleString()
                          : "-"}
                      </small>

                    </div>

                    <div className="note-actions">

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDeleteNote(
                            note._id
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                  </div>
                ))}

              </div>
            )}

            <Pagination
              page={notePagination.page}
              totalPages={
                notePagination.totalPages
              }
              hasNextPage={
                notePagination.hasNextPage
              }
              hasPreviousPage={
                notePagination.hasPreviousPage
              }
              onPageChange={(newPage) => {
                setNotePage(newPage);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            />

          </section>
        )}

      </main>
    </div>
  );
}

export default Admin;