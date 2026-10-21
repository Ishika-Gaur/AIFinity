import { useState, useEffect, useCallback } from "react";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import Button from "../components/Button";
import Card from "../components/Card";
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";
import emailjs from "@emailjs/browser";

/* =========================================================
   REUSABLE SVG ICONS
========================================================= */
function EmailIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function SupportIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ClockIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SpinnerIcon({ className = "w-5 h-5 animate-spin" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

/* =========================================================
   STATIC CONFIG & HELPERS
========================================================= */
const SUBJECT_PRESETS = ["Technical Issue", "Feature Idea", "Collaboration", "General Inquiry", "Other"];

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com", icon: GithubIcon },
  { label: "LinkedIn", href: "https://linkedin.com", icon: LinkedinIcon },
  { label: "Twitter / X", href: "https://x.com", icon: TwitterIcon },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
];



function FormInput({ id, label, type = "text", name, placeholder, value, onChange, onBlur, error, required = true }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text-h)" }}>
        {label} {required && <span style={{ color: "var(--color-error)" }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-4"
        style={
          error
            ? { borderColor: "var(--color-error)", background: "var(--color-surface)" }
            : { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-h)" }
        }
      />
      {error && <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-error)" }}>{error}</p>}
    </div>
  );
}

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "", customSubject: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let timer;
    if (submitted) {
      timer = setTimeout(() => setSubmitted(false), 6000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [submitted]);

  const validateField = useCallback((name, value) => {
    let error = "";
    const trimmed = value.trim();
    if (name === "name") {
      if (!trimmed) error = "Name is required";
      else if (trimmed.length < 2) error = "Name must be at least 2 characters";
    }
    if (name === "email") {
      if (!trimmed) error = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) error = "Please enter a valid email address";
    }
    if (name === "subject") {
      if (!trimmed) error = "Subject is required";
      else if (trimmed.length < 3) error = "Subject must be at least 3 characters";
    }
    if (name === "message") {
      if (!trimmed) error = "Message is required";
      else if (trimmed.length < 10) error = "Message must be at least 10 characters";
    }
    return error;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handlePresetSelect = (preset) => {
    setFormData((prev) => ({ ...prev, subject: preset }));
    setTouched((prev) => ({ ...prev, subject: true }));
    setErrors((prev) => ({ ...prev, subject: "" }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = {
    name: validateField("name", formData.name),
    email: validateField("email", formData.email),
    subject: validateField("subject", formData.subject),
    message: validateField("message", formData.message),
  };

  if (formData.subject === "Other" && !formData.customSubject.trim()) {
    newErrors.customSubject = "Please specify a subject";
  }

  setTouched({ name: true, email: true, subject: true, message: true });
  setErrors(newErrors);

  if (Object.values(newErrors).some(Boolean)) return;

  const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } = import.meta.env;
  if (!VITE_EMAILJS_SERVICE_ID || !VITE_EMAILJS_TEMPLATE_ID || !VITE_EMAILJS_PUBLIC_KEY) {
    setSendError("The contact form is not configured yet. Please contact us by direct email.");
    return;
  }

  setIsSubmitting(true);
  setSendError("");

  try {
    await emailjs.send(
      VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID,
      {
        name: formData.name.trim(),
        email: formData.email.trim(),
        title: formData.subject === "Other" ? formData.customSubject.trim() : formData.subject,
        message: formData.message.trim(),
      },
      { publicKey: VITE_EMAILJS_PUBLIC_KEY }
    );
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "", customSubject: "" });
    setTouched({});
    setErrors({});
  } catch (err) {
    console.error("EmailJS error:", err?.status, err?.text || err?.message || err);
    setSendError("We couldn't send your message. Please try again or contact us by direct email.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <HeroSection
        eyebrow="We'd Love to Hear From You"
        title="Let's build a better"
        highlightWord="learning journey together."
        description="Have a question, feedback, feature idea, or want to collaborate with Afinity AI? Our team is ready to assist."
      />

      {/* CONTACT CONTENT SECTION */}
      <Section >
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          {/* LEFT SIDE: CONTACT INFO */}
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary-600)" }}>
              GET IN TOUCH
            </div>

            <h2 className="max-w-lg text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
              We're here to help you make sense of your learning path.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7" style={{ color: "var(--color-text-muted)" }}>
              Whether you're exploring your career goals, analyzing skill gaps, or proposing improvements for Afinity AI, reach out to us anytime.
            </p>

            <div className="mt-8 space-y-4">
              <Card
                hoverable
                icon={<EmailIcon className="w-5 h-5" style={{ color: "var(--color-primary-600)" }} />}
                title="Email Us Direct"
                className="p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <a href="mailto:hello@aifinity.com" className="font-semibold transition-colors" style={{ color: "var(--color-primary-600)" }}>
                  hello@aifinity.com
                </a>
              </Card>

              <Card
                hoverable
                icon={<SupportIcon className="w-5 h-5" style={{ color: "var(--color-primary-600)" }} />}
                title="AIFinity  Support"
                className="p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Found an issue with an assessment, skill analysis, or roadmap? Share details so we can resolve it immediately.
                </p>
              </Card>

              <Card
                hoverable
                icon={<ClockIcon className="w-5 h-5" style={{ color: "var(--color-primary-600)" }} />}
                title="Response Time"
                className="p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  We review incoming messages and typically respond within{" "}
                  <strong className="font-bold" style={{ color: "var(--color-text-h)" }}>24 hours</strong>.
                </p>
              </Card>
            </div>

            {/* Social Links */}
            <div className="mt-10">
              <p className="mb-4 text-xs font-bold tracking-widest uppercase" style={{ color: "var(--color-text-light)" }}>
                Connect with AIFinity 
              </p>

              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }}
                    aria-label={label}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: CONTACT FORM */}
          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-2xl border p-6 shadow-xl sm:p-8"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="mb-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary-600)" }}>
                  SEND A MESSAGE
                </div>

                <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
                  How can we help?
                </h2>

                <p className="mt-1 text-sm" style={{ color: "var(--color-text-light)" }}>
                  Fill out the form below and our team will get back to you promptly.
                </p>
              </div>

              {sendError && (
              <div
                    className="mb-6 rounded-xl border p-4 text-sm font-medium"
                   style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
               >
                 {sendError}
                 </div>
                )}

              {/* Success Alert */}
              {submitted && (
                <div
                  className="mb-6 flex items-start justify-between gap-3 rounded-xl border p-4 transition-all"
                  style={{ borderColor: "var(--color-confirm)", background: "var(--color-primary-50)" }}
                >
                  <div className="flex gap-3">
                    <CheckCircleIcon className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--color-confirm)" }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-text-h)" }}>
                        Message sent successfully!
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        Thank you for reaching out. We will get back to you shortly.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="font-bold text-sm transition"
                    style={{ color: "var(--color-confirm)" }}
                    aria-label="Dismiss message"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormInput
                    id="name"
                    label="Your Name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.name}
                  />

                  <FormInput
                    id="email"
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                  />
                </div>

               {/* Subject Field (Dropdown) */}
<div>
  <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text-h)" }}>
    Subject <span style={{ color: "var(--color-error)" }}>*</span>
  </label>

  <select
    id="subject"
    name="subject"
    value={formData.subject}
    onChange={handleChange}
    onBlur={handleBlur}
    aria-invalid={Boolean(errors.subject)}
    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-4"
    style={
      errors.subject
        ? { borderColor: "var(--color-error)", background: "var(--color-surface)" }
        : { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-h)" }
    }
  >
    <option value="" disabled>
      Select a subject
    </option>
    {SUBJECT_PRESETS.map((preset) => (
      <option key={preset} value={preset}>
        {preset}
      </option>
    ))}
  </select>

  {errors.subject && (
    <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-error)" }}>
      {errors.subject}
    </p>
  )}

  {/* Show free-text input only when "Other" is chosen */}
  {formData.subject === "Other" && (
    <input
      type="text"
      name="customSubject"
      placeholder="Please specify your subject"
      value={formData.customSubject || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-invalid={Boolean(errors.customSubject)}
      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-4"
      style={errors.customSubject
        ? { borderColor: "var(--color-error)", background: "var(--color-surface)" }
        : { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-h)" }}
    />
  )}
  {errors.customSubject && (
    <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-error)" }}>
      {errors.customSubject}
    </p>
  )}
</div>

                {/* Message Field */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="message" className="block text-sm font-semibold" style={{ color: "var(--color-text-h)" }}>
                      Message <span style={{ color: "var(--color-error)" }}>*</span>
                    </label>

                    <span className="text-xs font-medium" style={{ color: "var(--color-text-light)" }}>
                      {formData.message.length} chars
                    </span>
                  </div>

                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(errors.message)}
                    className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-4"
                    style={
                      errors.message
                        ? { borderColor: "var(--color-error)", background: "var(--color-surface)" }
                        : { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-h)" }
                    }
                  />
                  {errors.message && <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--color-error)" }}>{errors.message}</p>}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                  icon={isSubmitting ? <SpinnerIcon /> : <span>→</span>}
                  iconPosition="right"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  
                </Button>

                <p className="text-center text-xs" style={{ color: "var(--color-text-light)" }}>
                  Your information is kept secure and only used to respond to your message.
                </p>
              </form>
            </div>
          </div>
        </div>
      </Section>

      {/* QUICK HELP SECTION */}
      <Section >
        <SectionHeading
          eyebrow="QUICK HELP"
          title="Looking for something specific?"
          subtitle="Here are common topics you can get immediate assistance with."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card
            hoverable
            eyebrow="01"
            title="Technical Support"
            className="p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            footer={
              <button
                type="button"
                onClick={() => handlePresetSelect("Technical Issue")}
                className="inline-flex items-center gap-1 text-sm font-semibold transition-all hover:translate-x-1"
                style={{ color: "var(--color-primary-600)" }}
              >
                Report an issue →
              </button>
            }
          >
            Having trouble with an assessment, dashboard, skill gap analysis, or custom roadmap? Let us know.
          </Card>

          <Card
            hoverable
            eyebrow="02"
            title="Feature Suggestion"
            className="p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            footer={
              <button
                type="button"
                onClick={() => handlePresetSelect("Feature Idea")}
                className="inline-flex items-center gap-1 text-sm font-semibold transition-all hover:translate-x-1"
                style={{ color: "var(--color-primary-600)" }}
              >
                Share your idea →
              </button>
            }
          >
            Have an idea that could make personalized learning more intuitive, intelligent, or effective?
          </Card>

          <Card
            hoverable
            eyebrow="03"
            title="Partnership & Collab"
            className="p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            footer={
              <button
                type="button"
                onClick={() => handlePresetSelect("Collaboration")}
                className="inline-flex items-center gap-1 text-sm font-semibold transition-all hover:translate-x-1"
                style={{ color: "var(--color-primary-600)" }}
              >
                Connect with us →
              </button>
            }
          >
            Interested in collaborating with AIFinity on education, research, AI models, or student innovation?
          </Card>
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section >
        <CtaBanner
          eyebrow="COGNIFY AI"
          title="Ready to elevate your learning journey?"
          buttonLabel="Explore Skill Gap"
          href="/skill-gap"
        />
      </Section>
    </div>
  );
}
