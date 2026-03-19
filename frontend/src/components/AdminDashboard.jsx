import { useMemo, useState } from "react";
import AdminAnalytics from "./AdminAnalytics";
import AdminSubjectWeightRules from "./AdminSubjectWeightRules";

export default function AdminDashboard({
  admin,
  adminToken,
  dashboard,
  users,
  courses,
  loading,
  error,
  onRefresh,
  onLogout,
  onDownloadCutoffTemplate,
  onDownloadCutoffHistoryTemplate,
  onUploadCutoffExcel,
  onUpdateUser,
  onUpdateCourseCutoff,
}) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [newCutoff, setNewCutoff] = useState("");
  const [cutoffYear, setCutoffYear] = useState("2026");
  const [excelFile, setExcelFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const selectedUser = useMemo(
    () => users.find((item) => item.id === Number(selectedUserId)) || null,
    [users, selectedUserId]
  );
  const selectedCourse = useMemo(
    () => courses.find((item) => item.id === Number(selectedCourseId)) || null,
    [courses, selectedCourseId]
  );

  return (
    <main className="shell admin-shell">
      <section className="hero">
        <p className="kicker">UniPath Admin Portal</p>
        <h1>Admissions Control Center</h1>
        <p>
          Signed in as {admin?.username}. Review activity, manage candidate accounts, and adjust
          course cutoffs.
        </p>
      </section>

      <div className="admin-toolbar">
        <button type="button" className="btn-secondary" onClick={onRefresh}>
          Refresh Dashboard
        </button>
        <button type="button" className="btn-secondary" onClick={onDownloadCutoffTemplate}>
          Download Cutoff CSV
        </button>
        <button type="button" className="btn-secondary" onClick={onDownloadCutoffHistoryTemplate}>
          Download History CSV
        </button>
        <button type="button" className="btn-muted" onClick={onLogout}>
          Logout Admin
        </button>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Bulk Update Cutoffs (Excel)</h2>
          <p>
            Upload an Excel file in the required format to update course cutoffs for different
            universities in one go.
          </p>
        </div>

        <div className="admin-form-row">
          <input
            type="file"
            accept=".xlsx,.xlsm"
            onChange={(event) => setExcelFile(event.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              if (!excelFile) {
                setUploadMessage("Select an Excel file first.");
                return;
              }
              const result = await onUploadCutoffExcel(excelFile);
              if (result) {
                setUploadMessage(
                  `Upload complete: ${result.created_courses} created, ${result.updated_courses} updated, ${result.updated_history_rows} history rows updated.`
                );
              }
            }}
          >
            Upload Excel
          </button>
        </div>

        {uploadMessage && <p className="status">{uploadMessage}</p>}
      </section>

      {error && <p className="status error">{error}</p>}
      {loading && <p className="status">Loading dashboard...</p>}

      <div className="admin-metrics-grid">
        <article className="card admin-metric"><h3>Candidates</h3><strong>{dashboard?.total_candidates || 0}</strong></article>
        <article className="card admin-metric"><h3>Submissions</h3><strong>{dashboard?.total_submissions || 0}</strong></article>
        <article className="card admin-metric"><h3>Today</h3><strong>{dashboard?.submissions_today || 0}</strong></article>
        <article className="card admin-metric"><h3>Courses</h3><strong>{dashboard?.total_courses || 0}</strong></article>
        <article className="card admin-metric"><h3>Universities</h3><strong>{dashboard?.total_universities || 0}</strong></article>
        <article className="card admin-metric"><h3>Admin Sessions</h3><strong>{dashboard?.total_admin_sessions || 0}</strong></article>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Manage Candidate Users</h2>
          <p>Inspect and update candidate identity details used in admissions calculations.</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Index</th>
                <th>Gender</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => setSelectedUserId(user.id)}>
                  <td>{user.id}</td>
                  <td>{`${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.index_number}</td>
                  <td>{user.gender}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedUser && (
          <div className="admin-form-row">
            <input
              type="text"
              value={selectedUser.first_name || ""}
              onChange={(event) => onUpdateUser(selectedUser.id, { first_name: event.target.value })}
              placeholder="First name"
            />
            <input
              type="text"
              value={selectedUser.last_name || ""}
              onChange={(event) => onUpdateUser(selectedUser.id, { last_name: event.target.value })}
              placeholder="Last name"
            />
            <input
              type="email"
              value={selectedUser.email || ""}
              onChange={(event) => onUpdateUser(selectedUser.id, { email: event.target.value })}
              placeholder="Email"
            />
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Manage Course Cutoff Points</h2>
          <p>Select a course and apply a new cutoff with optional history year.</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Course</th>
                <th>University</th>
                <th>Current Cutoff</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} onClick={() => setSelectedCourseId(course.id)}>
                  <td>{course.id}</td>
                  <td>{course.name}</td>
                  <td>{course.university__name}</td>
                  <td>{course.cutoff_weight}</td>
                  <td>{course.duration} yrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedCourse && (
          <div className="admin-form-row">
            <input
              type="number"
              step="0.01"
              placeholder="New cutoff"
              value={newCutoff}
              onChange={(event) => setNewCutoff(event.target.value)}
            />
            <input
              type="number"
              placeholder="Year"
              value={cutoffYear}
              onChange={(event) => setCutoffYear(event.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                onUpdateCourseCutoff(selectedCourse.id, {
                  cutoff_weight: newCutoff,
                  year: cutoffYear ? Number(cutoffYear) : undefined,
                })
              }
            >
              Update Cutoff
            </button>
          </div>
        )}
      </section>

      <AdminAnalytics token={adminToken} />

      <AdminSubjectWeightRules token={adminToken} courses={courses} />
    </main>
  );
}
