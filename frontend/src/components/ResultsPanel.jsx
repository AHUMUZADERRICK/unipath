import { useState } from "react";
import * as api from "../services/api";
import StrengthProfilePanel from "./StrengthProfilePanel";
import ApplicationPlanner from "./ApplicationPlanner";

export default function ResultsPanel({ loading, error, result, candidate }) {
  const [exporting, setExporting] = useState(false);

  const recommendationCards = result?.recommendation_groups
    ? [
        {
          label: "Top chances",
          value: result.recommendation_groups.top_chances?.length || 0,
          tone: "success",
        },
        {
          label: "Safe options",
          value: result.recommendation_groups.safe_options?.length || 0,
          tone: "info",
        },
        {
          label: "Ambitious choices",
          value: result.recommendation_groups.ambitious_choices?.length || 0,
          tone: "warm",
        },
      ]
    : [];

  const handleExportPDF = async () => {
    if (!candidate || !result) return;
    setExporting(true);
    try {
      await api.exportEligibilitySummaryPDF(
        candidate.id,
        result.course_evaluations || [],
        result.final_weight
      );
    } catch (err) {
      alert("Failed to export PDF: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="card results">
      <div className="card-head">
        <h2>Step 4: Qualification Results</h2>
        <p>Your computed PUJAB weight and eligible public university programs.</p>
      </div>

      {loading && <p className="status">Calculating your eligibility...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && !result && (
        <p className="status">Submit your details to see final weight and eligible courses.</p>
      )}

      {result && (
        <>
          <div className="weight-hero">
            <div>
              <span>Final Weight</span>
              <strong>{result.final_weight}</strong>
            </div>
            <div className="weight-hero-note">
              <p>Calculated using your submitted UACE combination, UCE grades, and profile rules.</p>
              <div className="weight-pulse" aria-hidden="true" />
            </div>
          </div>

          {result && candidate && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="btn-ghost btn-export"
            >
              {exporting ? "Exporting PDF..." : "Export Summary (PDF)"}
            </button>
          )}

          {recommendationCards.length > 0 && (
            <div className="recommendation-grid">
              {recommendationCards.map((card) => (
                <article key={card.label} className={`recommendation-card tone-${card.tone}`}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
          )}

          <StrengthProfilePanel result={result} />

          {result.eligible_courses.length === 0 ? (
            <p className="status">No course matched your current profile in the current Uganda dataset.</p>
          ) : (
            <div className="results-section">
              <div className="section-heading">
                <h3>Eligible Courses</h3>
                <p>Programs where your weight currently meets or exceeds the listed cutoff.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>University</th>
                      <th>Cutoff</th>
                      <th>Your Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.eligible_courses.map((course) => (
                      <tr key={`${course.course}-${course.university}`}>
                        <td>{course.course}</td>
                        <td>{course.university}</td>
                        <td>{course.cutoff}</td>
                        <td>{course.calculated_weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {Array.isArray(result.borderline_courses) && result.borderline_courses.length > 0 && (
            <div className="results-section">
              <div className="section-heading">
                <h3>Borderline Courses</h3>
                <p>Good stretch options that may deserve a closer look before applying.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Borderline Course</th>
                      <th>University</th>
                      <th>Cutoff</th>
                      <th>Your Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.borderline_courses.map((course) => (
                      <tr key={`borderline-${course.course}-${course.university}`}>
                        <td>{course.course}</td>
                        <td>{course.university}</td>
                        <td>{course.cutoff}</td>
                        <td>{course.calculated_weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {candidate && (
            <ApplicationPlanner
              candidateId={candidate.id}
              eligibleCourses={result.eligible_courses}
              onSaved={() => {
                // Could refresh dashboard if needed
              }}
            />
          )}

          {Array.isArray(result.course_evaluations) && result.course_evaluations.length > 0 && (
            <div className="results-section">
              <div className="section-heading">
                <h3>Evaluation Notes</h3>
                <p>A quick explanation for why each reviewed course passed or missed the threshold.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.course_evaluations.map((course) => (
                      <tr key={`eval-${course.course}-${course.university}`}>
                        <td>
                          {course.course}
                          <br />
                          <small>{course.university}</small>
                        </td>
                        <td>
                          <span className={`status-badge ${course.is_eligible ? "ok" : "muted"}`}>
                            {course.is_eligible ? "Eligible" : "Not Eligible"}
                          </span>
                        </td>
                        <td>{course.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
