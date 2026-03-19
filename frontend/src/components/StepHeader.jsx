export default function StepHeader({ currentStep }) {
  const steps = [
    "Enter UACE Results",
    "Enter UCE Grades",
    "Account Profile",
    "Calculate Courses",
  ];

  return (
    <div className="step-tracker">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;

        return (
          <div
            key={step}
            className={`step-chip ${isActive ? "active" : ""} ${isCompleted ? "done" : ""}`}
          >
            <span>{stepNumber}</span>
            <p>{step}</p>
          </div>
        );
      })}
    </div>
  );
}
