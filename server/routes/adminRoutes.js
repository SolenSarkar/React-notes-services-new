import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./Admin.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Admin({ user, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(10);
  const [userPagination, setUserPagination] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Notes
  const [notes, setNotes] = useState([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [debouncedNoteSearch, setDebouncedNoteSearch] = useState("");
  const [notePage, setNotePage] = useState(1);
  const [noteLimit] = useState(9);
  const [notePagination, setNotePagination] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);

  // General error
  const [error, setError] = useState("");

  // Edit note
  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // --------------------------------------------------
  // Get token
  // --------------------------------------------------

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // --------------------------------------------------
  // Common headers
  // --------------------------------------------------

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // --------------------------------------------------
  // Check admin access
  // --------------------------------------------------

  useEffect(() => {
    if (!user || user.role !== "admin") {
      toast.error("Admin access required");
      onBack();
    }
  }, [user, onBack]);

  // --------------------------------------------------
  // Debounce user search
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
      setUserPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [userSearch]);

  // --------------------------------------------------
  // Debounce note search
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNoteSearch(noteSearch);
      setNotePage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [noteSearch]);

  // --------------------------------------------------
  // Fetch dashboard stats
  // --------------------------------------------------

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/stats`,
        {
          method: "GET",
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
          data.message || "Failed to fetch admin stats"
        );
      }

      setStats(data);
    } catch (err) {
      console.error("Admin stats error:", err);

      const message =
        err.message || "Failed to load admin stats";

      setError(message);
      toast.error(message);
    } finally {
      setStatsLoading(false);
    }
  };

  // --------------------------------------------------
  // Fetch users
  // --------------------------------------------------

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const params = new URLSearchParams({
        search: debouncedUserSearch,
        page: userPage,
        limit: userLimit,
      });

      const response = await fetch(
        `${API_URL}/api/admin/users?${params.toString()}`,
        {
          method: "GET",
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
          data.message || "Failed to fetch users"
        );
      }

      setUsers(data.users || []);
      setUserPagination(data.pagination || null);
    } catch (err) {
      console.error("Admin users error:", err);

      const message =
        err.message || "Failed to load users";

      setError(message);
      toast.error(message);
    } finally {
      setUsersLoading(false);
    }
  };

  // --------------------------------------------------
  // Fetch notes
  // --------------------------------------------------

  const fetchNotes = async () => {
    try {
      setNotesLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const params = new URLSearchParams({
        search: debouncedNoteSearch,
        page: notePage,
        limit: noteLimit,
      });

      const response = await fetch(
        `${API_URL}/api/admin/notes?${params.toString()}`,
        {
          method: "GET",
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
          data.message || "Failed to fetch notes"
        );
      }

      setNotes(data.notes || []);
      setNotePagination(data.pagination || null);
    } catch (err) {
      console.error("Admin notes error:", err);

      const message =
        err.message || "Failed to load notes";

      setError(message);
      toast.error(message);
    } finally {
      setNotesLoading(false);
    }
  };

  // --------------------------------------------------
  // Initial dashboard load
  // --------------------------------------------------

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
    }
  }, [user]);

  // --------------------------------------------------
  // Load users when users tab/search/page changes
  // --------------------------------------------------

  useEffect(() => {
    if (
      user?.role === "admin" &&
      activeTab === "users"
    ) {
      fetchUsers();
    }
  }, [
    user,
    activeTab,
    debouncedUserSearch,
    userPage,
  ]);

  // --------------------------------------------------
  // Load notes when notes tab/search/page changes
  // --------------------------------------------------

  useEffect(() => {
    if (
      user?.role === "admin" &&
      activeTab === "notes"
    ) {
      fetchNotes();
    }
  }, [
    user,
    activeTab,
    debouncedNoteSearch,
    notePage,
  ]);

  // --------------------------------------------------
  // Delete note
  // --------------------------------------------------

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
          data.message || "Failed to remove note"
        );
      }

      setNotes((currentNotes) =>
        currentNotes.filter(
          (note) => note._id !== noteId
        )
      );

      toast.success(
        data.message || "Note removed successfully"
      );

      // Refresh pagination/stats if necessary
      fetchStats();

      if (
        notes.length === 1 &&
        notePage > 1
      ) {
        setNotePage((currentPage) =>
          Math.max(1, currentPage - 1)
        );
      } else {
        fetchNotes();
      }
    } catch (err) {
      console.error(
        "Admin delete note error:",
        err
      );

      const message =
        err.message || "Failed to remove note";

      setError(message);
      toast.error(message);
    }
  };

  // --------------------------------------------------
  // Open edit modal
  // --------------------------------------------------

  const handleOpenEditNote = (note) => {
    setEditingNote(note);
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
    setError("");
  };

  // --------------------------------------------------
  // Close edit modal
  // --------------------------------------------------

  const handleCloseEditNote = () => {
    if (savingEdit) {
      return;
    }

    setEditingNote(null);
    setEditTitle("");
    setEditContent("");
  };

  // --------------------------------------------------
  // Update note
  // --------------------------------------------------

  const handleEditNote = async (e) => {
    e.preventDefault();

    const title = editTitle.trim();
    const content = editContent.trim();

    if (!title) {
      toast.error("Note title is required");
      return;
    }

    if (!content) {
      toast.error("Note content is required");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/notes/${editingNote._id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            title,
            content,
          }),
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
          data.message || "Failed to update note"
        );
      }

      const updatedNote = data.note || {
        ...editingNote,
        title,
        content,
      };

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note._id === editingNote._id
            ? {
                ...note,
                ...updatedNote,
              }
            : note
        )
      );

      setEditingNote(null);
      setEditTitle("");
      setEditContent("");
      setError("");

      toast.success(
        data.message || "Note updated successfully"
      );
    } catch (err) {
      console.error(
        "Admin edit note error:",
        err
      );

      const message =
        err.message || "Failed to update note";

      setError(message);
      toast.error(message);
    } finally {
      setSavingEdit(false);
    }
  };

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");

    if (tab === "users") {
      setUserPage(1);
    }

    if (tab === "notes") {
      setNotePage(1);
    }
  };

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // --------------------------------------------------
  // Dashboard stat helper
  // --------------------------------------------------

  const getStatValue = (keys) => {
    if (!stats) {
      return 0;
    }

    for (const key of keys) {
      if (
        stats[key] !== undefined &&
        stats[key] !== null
      ) {
        return stats[key];
      }
    }

    return 0;
  };

  // --------------------------------------------------
  // Render pagination
  // --------------------------------------------------

  const renderPagination = (
    pagination,
    currentPage,
    setPage
  ) => {
    if (
      !pagination ||
      pagination.totalPages <= 1
    ) {
      return null;
    }

    return (
      <div className="admin-pagination">
        <button
          type="button"
          disabled={!pagination.hasPreviousPage}
          onClick={() =>
            setPage((page) =>
              Math.max(1, page - 1)
            )
          }
        >
          Previous
        </button>

        <span>
          Page {currentPage} of{" "}
          {pagination.totalPages}
        </span>

        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() =>
            setPage((page) => page + 1)
          }
        >
          Next
        </button>
      </div>
    );
  };

  // --------------------------------------------------
  // Admin protection
  // --------------------------------------------------

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-header">

        <div className="admin-header-left">
          <div className="admin-logo">
            Notes Admin
          </div>

          <div className="admin-welcome">
            Welcome, {user.name || "Admin"}
          </div>
        </div>

        <div className="admin-header-actions">

          <button
            type="button"
            className="admin-my-notes-button"
            onClick={onBack}
          >
            My Notes
          </button>

          <button
            type="button"
            className="admin-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="admin-nav">

        <button
          type="button"
          className={
            activeTab === "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            handleTabChange("dashboard")
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
            handleTabChange("users")
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
            handleTabChange("notes")
          }
        >
          Notes
        </button>

      </nav>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-content">

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activeTab === "dashboard" && (
          <section className="admin-section">

            <div className="admin-section-header">
              <div>
                <h1>Dashboard</h1>
                <p>
                  Overview of your Notes Services
                  application.
                </p>
              </div>

              <button
                type="button"
                className="admin-refresh-button"
                onClick={fetchStats}
                disabled={statsLoading}
              >
                {statsLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>

            {statsLoading ? (
              <div className="admin-loading">
                <div className="admin-spinner"></div>
                <p>Loading dashboard...</p>
              </div>
            ) : (
              <div className="admin-stats-grid">

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    👥
                  </div>

                  <div>
                    <h3>Users</h3>
                    <strong>
                      {getStatValue([
                        "totalUsers",
                        "users",
                      ])}
                    </strong>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    📝
                  </div>

                  <div>
                    <h3>Notes</h3>
                    <strong>
                      {getStatValue([
                        "totalNotes",
                        "notes",
                      ])}
                    </strong>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    👑
                  </div>

                  <div>
                    <h3>Admins</h3>
                    <strong>
                      {getStatValue([
                        "totalAdmins",
                        "admins",
                      ])}
                    </strong>
                  </div>
                </div>

              </div>
            )}

          </section>
        )}

        {/* =================================================
            USERS
        ================================================= */}

        {activeTab === "users" && (
          <section className="admin-section">

            <div className="admin-section-header">
              <div>
                <h1>Users</h1>
                <p>
                  View and manage registered
                  users.
                </p>
              </div>
            </div>

            {/* Search */}

            <div className="admin-search-container">

              <input
                type="text"
                value={userSearch}
                onChange={(e) =>
                  setUserSearch(e.target.value)
                }
                placeholder="Search users by name or email..."
                className="admin-search-input"
              />

              {userSearch && (
                <button
                  type="button"
                  className="admin-clear-search"
                  onClick={() =>
                    setUserSearch("")
                  }
                >
                  ×
                </button>
              )}

            </div>

            {usersLoading ? (
              <div className="admin-loading">
                <div className="admin-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="admin-empty">
                <div className="admin-empty-icon">
                  👥
                </div>

                <h3>No users found</h3>

                <p>
                  No users match your search.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((currentUser) => (
                        <tr
                          key={currentUser._id}
                        >
                          <td>
                            {currentUser.name ||
                              "Unknown"}
                          </td>

                          <td>
                            {currentUser.email ||
                              "Unknown"}
                          </td>

                          <td>
                            <span
                              className={`admin-role ${
                                currentUser.role ===
                                "admin"
                                  ? "admin-role-admin"
                                  : "admin-role-user"
                              }`}
                            >
                              {currentUser.role ||
                                "user"}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              currentUser.createdAt
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>

                {renderPagination(
                  userPagination,
                  userPage,
                  setUserPage
                )}
              </>
            )}

          </section>
        )}

        {/* =================================================
            NOTES
        ================================================= */}

        {activeTab === "notes" && (
          <section className="admin-section">

            <div className="admin-section-header">
              <div>
                <h1>All Notes</h1>
                <p>
                  View, edit and remove notes
                  created by users.
                </p>
              </div>
            </div>

            {/* Search */}

            <div className="admin-search-container">

              <input
                type="text"
                value={noteSearch}
                onChange={(e) =>
                  setNoteSearch(e.target.value)
                }
                placeholder="Search notes by title or content..."
                className="admin-search-input"
              />

              {noteSearch && (
                <button
                  type="button"
                  className="admin-clear-search"
                  onClick={() =>
                    setNoteSearch("")
                  }
                >
                  ×
                </button>
              )}

            </div>

            {notesLoading ? (
              <div className="admin-loading">
                <div className="admin-spinner"></div>
                <p>Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="admin-empty">
                <div className="admin-empty-icon">
                  📝
                </div>

                <h3>No notes found</h3>

                <p>
                  No notes match your search.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-notes-grid">

                  {notes.map((note) => (
                    <article
                      className="admin-note-card"
                      key={note._id}
                    >

                      <div className="admin-note-card-header">

                        <h3>
                          {note.title ||
                            "Untitled Note"}
                        </h3>

                        <span className="admin-note-date">
                          {formatDate(
                            note.createdAt
                          )}
                        </span>

                      </div>

                      <div className="admin-note-content">
                        {note.content ||
                          "No content"}
                      </div>

                      <div className="admin-note-owner">

                        <strong>
                          Owner:
                        </strong>{" "}

                        {note.user?.name ||
                          "Unknown User"}

                        {note.user?.email && (
                          <span>
                            {" "}
                            ({note.user.email})
                          </span>
                        )}

                      </div>

                      {/* Note Actions */}

                      <div className="admin-note-actions">

                        <button
                          type="button"
                          className="edit-button"
                          onClick={() =>
                            handleOpenEditNote(
                              note
                            )
                          }
                        >
                          Edit
                        </button>

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

                    </article>
                  ))}

                </div>

                {renderPagination(
                  notePagination,
                  notePage,
                  setNotePage
                )}
              </>
            )}

          </section>
        )}

      </main>

      {/* =================================================
          EDIT NOTE MODAL
      ================================================= */}

      {editingNote && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !savingEdit
            ) {
              handleCloseEditNote();
            }
          }}
        >

          <div
            className="admin-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-note-title"
          >

            <div className="admin-modal-header">

              <h2 id="edit-note-title">
                Edit Note
              </h2>

              <button
                type="button"
                className="admin-modal-close"
                onClick={handleCloseEditNote}
                disabled={savingEdit}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <form
              className="admin-edit-form"
              onSubmit={handleEditNote}
            >

              <label htmlFor="edit-note-title-input">
                Title
              </label>

              <input
                id="edit-note-title-input"
                type="text"
                value={editTitle}
                onChange={(e) =>
                  setEditTitle(e.target.value)
                }
                placeholder="Enter note title"
                disabled={savingEdit}
                autoFocus
              />

              <label htmlFor="edit-note-content-input">
                Content
              </label>

              <textarea
                id="edit-note-content-input"
                value={editContent}
                onChange={(e) =>
                  setEditContent(e.target.value)
                }
                placeholder="Enter note content"
                disabled={savingEdit}
              />

              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={handleCloseEditNote}
                  disabled={savingEdit}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-modal-save"
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Admin;