"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { trpc } from "../../../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  relationship: z.string().min(1, "Relationship is required"),
});

export default function NewSwimmerPage() {
  const { t } = useLocale();
  const router = useRouter();
  const myTeams = trpc.viewer.teams.list.useQuery({ includeOrgs: false });
  
  const createSwimmer = trpc.viewer.swim.swimmers.create.useMutation({
    onSuccess: () => {
      showToast(t("swim.swimmerCreated", { defaultValue: "Swimmer profile created!" }), "success");
      router.push("/parent");
    },
    onError: (error) => {
      showToast(error.message || `${t("something_went_wrong")} ${t("please_try_again")}`, "error");
    },
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{
    name: string;
    phone: string;
    relationship: string;
  }>>([{ name: "", phone: "", relationship: "" }]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const teams = myTeams.data || [];
  const defaultTeamId = teams[0]?.id;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!birthDate) newErrors.birthDate = "Date of birth is required";
    
    // Validate at least one emergency contact
    const validContacts = emergencyContacts.filter(c => c.name && c.phone && c.relationship);
    if (validContacts.length === 0) {
      newErrors.emergencyContact = "At least one emergency contact is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    if (!defaultTeamId) {
      showToast("Please join a swim school first", "error");
      return;
    }

    // Filter out empty contacts
    const validContacts = emergencyContacts.filter(c => c.name && c.phone && c.relationship);

    await createSwimmer.mutateAsync({
      teamId: defaultTeamId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: new Date(birthDate).toISOString(),
      currentLevel: currentLevel.trim() || undefined,
      medicalNotes: medicalNotes.trim() || undefined,
      emergencyContacts: validContacts.length > 0 ? validContacts : undefined,
    });
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([...emergencyContacts, { name: "", phone: "", relationship: "" }]);
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const updateEmergencyContact = (index: number, field: "name" | "phone" | "relationship", value: string) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const isSubmitting = createSwimmer.status === "pending";

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        {t("swim.addSwimmer", { defaultValue: "Add Swimmer" })}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Enter first name"
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Enter last name"
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Swim Level
            </label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select level...</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Pre-Competitive">Pre-Competitive</option>
              <option value="Competitive">Competitive</option>
            </select>
          </div>
        </div>

        {/* Medical Notes */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700">Medical Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Notes / Allergies
            </label>
            <textarea
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Any medical conditions, allergies, or special needs..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Include any information instructors should know for safety
            </p>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">
              Emergency Contacts <span className="text-red-500">*</span>
            </h2>
            <button
              type="button"
              onClick={addEmergencyContact}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Contact
            </button>
          </div>

          {errors.emergencyContact && (
            <p className="text-xs text-red-500">{errors.emergencyContact}</p>
          )}

          {emergencyContacts.map((contact, index) => (
            <div key={index} className="border rounded p-3 space-y-2 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Contact {index + 1}</span>
                {emergencyContacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                placeholder="Full name"
              />

              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => updateEmergencyContact(index, "phone", e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                placeholder="Phone number"
              />

              <input
                type="text"
                value={contact.relationship}
                onChange={(e) => updateEmergencyContact(index, "relationship", e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                placeholder="Relationship (e.g., Mother, Father, Guardian)"
              />
            </div>
          ))}
        </div>

        {/* Submit Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            {isSubmitting ? "Creating..." : "Create Swimmer Profile"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full border border-gray-300 rounded py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
