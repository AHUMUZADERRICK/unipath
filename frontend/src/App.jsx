import { useEffect, useMemo, useState } from "react";

import AdminDashboard from "./components/AdminDashboard";
import AuthPanel from "./components/AuthPanel";
import GenderStep from "./components/GenderStep";
import ResultsPanel from "./components/ResultsPanel";
import StepHeader from "./components/StepHeader";
import UACEResultsStep from "./components/UACEResultsStep";
import UCEGradesStep from "./components/UCEGradesStep";
import {
  calculateWeight,
  downloadAdminCutoffHistoryTemplate,
  downloadAdminCutoffTemplate,
  fetchAdminCourses,
  fetchAdminDashboard,
  fetchAdminUsers,
  fetchUaceSubjects,
  loginAdmin,
  loginCandidate,
  logoutAdmin,
  signupCandidate,
  uploadAdminCutoffExcel,
  updateAdminUser,
  updateCourseCutoff,
} from "./services/api";

function makeInitialUACERows() {
  return [
    { id: crypto.randomUUID(), subject: "", grade: "" },
    { id: crypto.randomUUID(), subject: "", grade: "" },
    { id: crypto.randomUUID(), subject: "", grade: "" },
  ];
}

export default function App() {
  const [uaceRows, setUaceRows] = useState(makeInitialUACERows);
  const [uceGrades, setUceGrades] = useState(Array(8).fill(""));
  const [adminSession, setAdminSession] = useState(() => {
    try {
      const raw = localStorage.getItem("unipath-admin-session");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [candidate, setCandidate] = useState(() => {
    try {
      const raw = localStorage.getItem("unipath-candidate");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [uaceSubjects, setUaceSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const subjects = await fetchUaceSubjects();
        if (!cancelled) {
          setUaceSubjects(subjects);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError("Could not load UACE subjects. Confirm backend is running.");
        }
      } finally {
        if (!cancelled) {
          setSubjectsLoading(false);
        }
      }
    };

    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, []);

  const step = useMemo(() => {
    const hasCompleteUace = uaceRows.filter((row) => row.subject.trim() && row.grade).length >= 3;
    const hasAnyUce = uceGrades.some((grade) => grade);
    if (!hasCompleteUace) {
      return 1;
    }
    if (!hasAnyUce) {
      return 2;
    }
    return 3;
  }, [uaceRows, uceGrades]);

  const addUaceRow = () => {
    setUaceRows((previous) => [...previous, { id: crypto.randomUUID(), subject: "", grade: "" }]);
  };

  const removeUaceRow = (indexToRemove) => {
    setUaceRows((previous) => previous.filter((_, index) => index !== indexToRemove));
  };

  const updateUaceRow = (indexToUpdate, field, value) => {
    setUaceRows((previous) =>
      previous.map((row, index) => (index === indexToUpdate ? { ...row, [field]: value } : row))
    );
  };

  const updateUceGrade = (indexToUpdate, value) => {
    setUceGrades((previous) =>
      previous.map((grade, index) => (index === indexToUpdate ? value : grade))
    );
  };

  const buildPayload = () => {
    const uaceResults = {};
    uaceRows.forEach((row) => {
      const subject = row.subject.trim();
      if (subject && row.grade) {
        uaceResults[subject] = row.grade;
      }
    });

    return {
      candidate_id: candidate?.id,
      gender: candidate?.gender,
      uace_results: uaceResults,
      uce_grades: uceGrades.filter(Boolean),
    };
  };

  const validateBeforeSubmit = () => {
    const payload = buildPayload();
    const subjects = Object.keys(payload.uace_results);
    if (subjects.length < 3) {
      return "Add at least 3 UACE subjects with valid grades.";
    }

    if (new Set(subjects).size !== subjects.length) {
      return "Duplicate UACE subjects are not allowed.";
    }

    if (uaceSubjects.length > 0) {
      const allowed = new Set(uaceSubjects);
      const invalidSubjects = subjects.filter((subject) => !allowed.has(subject));
      if (invalidSubjects.length > 0) {
        return "All selected subjects must come from the Uganda A-Level subject catalog.";
      }
    }

    return "";
  };

  const onCalculate = async () => {
    setError("");
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const response = await calculateWeight(payload);
      setResult(response);
    } catch (requestError) {
      if (requestError.response?.data?.detail) {
        setError(requestError.response.data.detail);
      } else if (requestError.response?.data) {
        setError("Request validation failed. Please check your entries.");
      } else {
        setError("Could not reach the server. Confirm backend is running.");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const completeAuth = (profile) => {
    setCandidate(profile);
    localStorage.setItem("unipath-candidate", JSON.stringify(profile));
    setAuthError("");
  };

  const handleSignup = async (payload) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const response = await signupCandidate(payload);
      completeAuth(response.candidate);
    } catch (requestError) {
      setAuthError(
        requestError.response?.data?.detail
          || requestError.response?.data?.confirm_password?.[0]
          || "Signup failed. Please verify details."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (payload) => {
    setAuthError("");
    setAuthLoading(true);

    const identifier = payload.identifier?.trim() || "";
    const password = payload.password;
    const canAttemptCandidate = identifier.includes("@");

    const tryCandidateLogin = async () => {
      const candidateResponse = await loginCandidate({
        email: identifier.toLowerCase(),
        password,
      });
      completeAuth(candidateResponse.candidate);
    };

    try {
      if (canAttemptCandidate) {
        try {
          await tryCandidateLogin();
          return;
        } catch {
          // fallback to admin login below
        }
      }

      const adminResponse = await loginAdmin({
        username: identifier,
        password,
      });
      const nextSession = {
        token: adminResponse.token,
        admin: adminResponse.admin,
      };
      setAdminSession(nextSession);
      localStorage.setItem("unipath-admin-session", JSON.stringify(nextSession));
      localStorage.removeItem("unipath-candidate");
      setCandidate(null);
    } catch (adminRequestError) {
      setAuthError(adminRequestError.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setCandidate(null);
    localStorage.removeItem("unipath-candidate");
    setResult(null);
  };

  const refreshAdminDashboard = async (session = adminSession) => {
    if (!session?.token) {
      return;
    }

    setAdminLoading(true);
    setAdminError("");
    try {
      const [dashboardData, usersData, coursesData] = await Promise.all([
        fetchAdminDashboard(session.token),
        fetchAdminUsers(session.token),
        fetchAdminCourses(session.token),
      ]);
      setAdminDashboard(dashboardData);
      setAdminUsers(usersData);
      setAdminCourses(coursesData);
    } catch (requestError) {
      setAdminError(requestError.response?.data?.detail || "Failed to load admin dashboard.");
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (adminSession?.token) {
      refreshAdminDashboard(adminSession);
    }
  }, [adminSession]);

  const handleAdminLogout = async () => {
    try {
      if (adminSession?.token) {
        await logoutAdmin(adminSession.token);
      }
    } catch {
      // best-effort logout
    } finally {
      setAdminSession(null);
      setAdminDashboard(null);
      setAdminUsers([]);
      setAdminCourses([]);
      localStorage.removeItem("unipath-admin-session");
    }
  };

  const handleUpdateAdminUser = async (candidateId, payload) => {
    if (!adminSession?.token) {
      return;
    }
    try {
      const response = await updateAdminUser(adminSession.token, candidateId, payload);
      setAdminUsers((previous) =>
        previous.map((item) => (item.id === candidateId ? { ...item, ...response.candidate } : item))
      );
    } catch (requestError) {
      setAdminError(requestError.response?.data?.detail || "Could not update user.");
    }
  };

  const handleUpdateCourseCutoff = async (courseId, payload) => {
    if (!adminSession?.token) {
      return;
    }
    try {
      const response = await updateCourseCutoff(adminSession.token, courseId, payload);
      setAdminCourses((previous) =>
        previous.map((item) =>
          item.id === courseId ? { ...item, cutoff_weight: response.course.cutoff_weight } : item
        )
      );
    } catch (requestError) {
      setAdminError(requestError.response?.data?.detail || "Could not update course cutoff.");
    }
  };

  const handleDownloadCutoffTemplate = async () => {
    if (!adminSession?.token) {
      return;
    }
    try {
      await downloadAdminCutoffTemplate(adminSession.token);
    } catch (requestError) {
      setAdminError(requestError.response?.data?.detail || "Could not download cutoff template.");
    }
  };

  const handleDownloadCutoffHistoryTemplate = async () => {
    if (!adminSession?.token) {
      return;
    }
    try {
      await downloadAdminCutoffHistoryTemplate(adminSession.token);
    } catch (requestError) {
      setAdminError(requestError.response?.data?.detail || "Could not download history template.");
    }
  };

  const handleUploadCutoffExcel = async (file) => {
    if (!adminSession?.token) {
      return null;
    }
    try {
      const response = await uploadAdminCutoffExcel(adminSession.token, file);
      await refreshAdminDashboard();
      return response;
    } catch (requestError) {
      setAdminError(requestError.response?.data?.detail || "Could not upload Excel cutoff file.");
      return null;
    }
  };

  if (adminSession?.token) {
    return (
      <AdminDashboard
        admin={adminSession.admin}
        adminToken={adminSession.token}
        dashboard={adminDashboard}
        users={adminUsers}
        courses={adminCourses}
        loading={adminLoading}
        error={adminError}
        onRefresh={() => refreshAdminDashboard()}
        onLogout={handleAdminLogout}
        onDownloadCutoffTemplate={handleDownloadCutoffTemplate}
        onDownloadCutoffHistoryTemplate={handleDownloadCutoffHistoryTemplate}
        onUploadCutoffExcel={handleUploadCutoffExcel}
        onUpdateUser={handleUpdateAdminUser}
        onUpdateCourseCutoff={handleUpdateCourseCutoff}
      />
    );
  }

  if (!candidate) {
    return (
      <main className="shell">
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />

        <section className="hero">
          <p className="kicker">Uganda Public University Admissions</p>
          <h1>UniPath Qualification System</h1>
          <p>Create your account or sign in to continue with a personalized admissions estimate.</p>
        </section>

        <div className="layout auth-layout">
          <div className="left">
            <AuthPanel
              onLogin={handleLogin}
              onSignup={handleSignup}
              loading={authLoading}
              error={authError}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />

      <section className="hero">
        <p className="kicker">Uganda Public University Admissions</p>
        <h1>UniPath Qualification System</h1>
        <p>
          Enter your UACE and UCE results, apply PUJAB weighting rules, and instantly see
          eligible courses in public universities.
        </p>
      </section>

      <StepHeader currentStep={result ? 4 : step} />

      <div className="layout">
        <div className="left">
          <UACEResultsStep
            rows={uaceRows}
            subjects={uaceSubjects}
            subjectsLoading={subjectsLoading}
            onAddRow={addUaceRow}
            onRemoveRow={removeUaceRow}
            onChange={updateUaceRow}
          />
          <UCEGradesStep grades={uceGrades} onChange={updateUceGrade} />
          <GenderStep gender={candidate.gender} locked whatsapp={candidate.whatsapp_number} indexNumber={candidate.index_number} onLogout={logout} />

          <button
            type="button"
            className="btn-primary"
            onClick={onCalculate}
            disabled={loading || subjectsLoading}
          >
            {loading ? "Calculating..." : "Calculate My Courses"}
          </button>

          <p className="calc-note">
            Note: final qualification can vary because subjects are weighted differently per course
            (for example essential vs relevant vs desirable), and additional criteria may apply.
          </p>
        </div>

        <div className="right">
          <ResultsPanel loading={loading} error={error} result={result} candidate={candidate} />
        </div>
      </div>
    </main>
  );
}
