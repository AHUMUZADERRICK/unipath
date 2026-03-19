import { useState, useEffect } from "react";
import * as api from "../services/api";

export default function AdminAnalytics({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchAdminAnalytics(token);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "16px", color: "#6b7280" }}>Loading analytics...</div>;
  }

  if (error) {
    return <div style={{ padding: "16px", color: "#dc2626" }}>Error: {error}</div>;
  }

  if (!analytics) {
    return <div style={{ padding: "16px", color: "#6b7280" }}>No analytics data</div>;
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>📊 Analytics</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <div style={{ padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #dcfce7" }}>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Total Submissions</div>
          <div style={{ fontSize: "20px", fontWeight: 600, color: "#059669" }}>
            {analytics.total_submissions}
          </div>
        </div>

        <div style={{ padding: "16px", backgroundColor: "#f3f4f6", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Total Candidates</div>
          <div style={{ fontSize: "20px", fontWeight: 600, color: "#374151" }}>
            {analytics.total_candidates}
          </div>
        </div>

        <div style={{ padding: "16px", backgroundColor: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Avg Weight</div>
          <div style={{ fontSize: "20px", fontWeight: 600, color: "#0284c7" }}>
            {parseFloat(analytics.average_weight).toFixed(2)}
          </div>
        </div>
      </div>

      {analytics.top_courses && analytics.top_courses.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", marginTop: 0 }}>
            🎯 Top 10 Most Selected Courses
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Course</th>
                  <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>University</th>
                  <th style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #d1d5db" }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_courses.map((course, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb" }}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>{course.course_name}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>{course.university}</td>
                    <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e5e7eb", fontWeight: 500 }}>
                      {course.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics.common_profiles && analytics.common_profiles.length > 0 && (
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", marginTop: 0 }}>
            👥 Common Student Profiles
          </h4>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {analytics.common_profiles.map((profile, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px",
                  backgroundColor: "#ede9fe",
                  borderRadius: "6px",
                  border: "1px solid #d8b4fe",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontWeight: 500, color: "#711c91" }}>{profile.value}</div>
                <div style={{ fontSize: "12px", color: "#a78bfa" }}>({profile.count} candidates)</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
