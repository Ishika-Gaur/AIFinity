import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "../Button";
import { useStudentAuth } from "../../context/StudentAuthContext";
import { authApi } from "../../services/api";
import { FIELDS } from "../../utils/constants";

export default function ProfileEditModal({ isOpen, onClose, careerGoal, onUpdateGoal }) {
  const { user, applySession } = useStudentAuth();
  
  const [currentGoal, setCurrentGoal] = useState({
    title: careerGoal?.title || "PROFILE & CAREER GOAL",
    role: careerGoal?.role || "Machine Learning Engineer",
    tags: careerGoal?.tags || ["Python", "ML", "Deep Learning", "NLP", "GenAI"],
  });

  const [selectedRole, setSelectedRole] = useState(currentGoal.role);
  const [customTagsInput, setCustomTagsInput] = useState(currentGoal.tags.join(", "));
  
  const [name, setName] = useState(user?.name || "");
  const [field, setField] = useState(user?.selectedField || user?.onboardingProfile?.field || "");
  const [level, setLevel] = useState(user?.onboardingProfile?.level || "Beginner");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setField(user.selectedField || user.onboardingProfile?.field || "");
      setLevel(user.onboardingProfile?.level || "Beginner");
    }
  }, [user]);
  
  useEffect(() => {
    if (careerGoal) {
      setCurrentGoal({
        title: careerGoal.title || "PROFILE & CAREER GOAL",
        role: careerGoal.role || "Machine Learning Engineer",
        tags: careerGoal.tags || ["Python", "ML"],
      });
      setSelectedRole(careerGoal.role || "Machine Learning Engineer");
      setCustomTagsInput((careerGoal.tags || []).join(", "));
    }
  }, [careerGoal]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const parsedTags = customTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedRole = selectedRole.trim() || "Machine Learning Engineer";
    const updated = {
      ...currentGoal,
      role: updatedRole,
      tags: parsedTags.length > 0 ? parsedTags : ["Python", "AI"],
    };

    try {
      const res = await authApi.updateProfile({
        name,
        field,
        careerGoal: updatedRole,
        level,
      });
      if (res && res.success && res.user) {
        applySession(res.user);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }

    if (onUpdateGoal) {
      onUpdateGoal(updated);
    }
    
    setLoading(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B332C]/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FBF8F0] border-2 border-[#C4952A] p-6 sm:p-7 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#2E4F42]/15 pb-3 mb-4">
          <div>
            <h3 className="font-sans text-xl font-bold text-[#1B332C]">
              Update Profile & Career Goal
            </h3>
            <p className="text-xs text-[#5B6B5F] font-sans mt-0.5">
              Customize your profile and target pathway to personalize your analytics.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg h-8 w-8 inline-flex items-center justify-center text-[#5B6B5F] hover:bg-[#EDE6D3] hover:text-[#1B332C] transition-colors font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B332C]">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-3.5 py-2 text-sm text-[#1B332C] focus:border-[#C4952A] focus:outline-none focus:ring-1 focus:ring-[#C4952A]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B332C]">
                Target Field
              </label>
              <input
                type="text"
                list="modal-field-options"
                value={field}
                onChange={(e) => setField(e.target.value)}
                required
                className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-3.5 py-2 text-sm text-[#1B332C] focus:border-[#C4952A] focus:outline-none focus:ring-1 focus:ring-[#C4952A]"
              />
              <datalist id="modal-field-options">
                {FIELDS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B332C]">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-3.5 py-2 text-sm text-[#1B332C] focus:border-[#C4952A] focus:outline-none focus:ring-1 focus:ring-[#C4952A]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-[#2E4F42]/10 pt-4">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B332C]">
              Target Role / Career Goal
            </label>
            <input
              type="text"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              placeholder="e.g. Machine Learning Engineer"
              required
              className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-3.5 py-2 text-sm text-[#1B332C] focus:border-[#C4952A] focus:outline-none focus:ring-1 focus:ring-[#C4952A]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B332C]">
              Target Skill Competencies (Comma-separated)
            </label>
            <input
              type="text"
              value={customTagsInput}
              onChange={(e) => setCustomTagsInput(e.target.value)}
              placeholder="e.g. Python, ML, Deep Learning, NLP, GenAI"
              required
              className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-3.5 py-2 text-sm text-[#1B332C] focus:border-[#C4952A] focus:outline-none focus:ring-1 focus:ring-[#C4952A]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E4F42]/15">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Profile & Recalculate"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
