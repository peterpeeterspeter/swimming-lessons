"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../_trpc/trpc";

export default function ManagerSkillsPage() {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [skills, setSkills] = useState<string[]>([""]);
  const [parentId, setParentId] = useState<string | null>(null);

  const utils = trpc.useContext();

  // Get user's teams
  const { data: teams } = trpc.viewer.teams.list.useQuery();

  // Get skill tree
  const { data: skillTree } = trpc.viewer.swim.skills.getSkillTree.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  // Create mutation
  const createMutation = trpc.viewer.swim.skills.createSkillLevel.useMutation({
    onSuccess: () => {
      showToast("Skill level created", "success");
      utils.viewer.swim.skills.getSkillTree.invalidate();
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = trpc.viewer.swim.skills.updateSkillLevel.useMutation({
    onSuccess: () => {
      showToast("Skill level updated", "success");
      utils.viewer.swim.skills.getSkillTree.invalidate();
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = trpc.viewer.swim.skills.deleteSkillLevel.useMutation({
    onSuccess: () => {
      showToast("Skill level deleted", "success");
      utils.viewer.swim.skills.getSkillTree.invalidate();
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#3b82f6");
    setSkills([""]);
    setParentId(null);
    setEditingLevel(null);
    setShowAddForm(false);
  };

  const handleSubmit = () => {
    if (!selectedTeamId || !name || skills.filter((s) => s.trim()).length === 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const cleanSkills = skills.filter((s) => s.trim());

    if (editingLevel) {
      updateMutation.mutate({
        id: editingLevel.id,
        name,
        description: description || undefined,
        color,
        skills: cleanSkills,
        parentId: parentId || null,
      });
    } else {
      createMutation.mutate({
        teamId: selectedTeamId,
        name,
        description: description || undefined,
        color,
        skills: cleanSkills,
        parentId: parentId || undefined,
      });
    }
  };

  const handleEdit = (level: any) => {
    setEditingLevel(level);
    setName(level.name);
    setDescription(level.description || "");
    setColor(level.color || "#3b82f6");
    setSkills(level.skills as string[]);
    setParentId(level.parentId);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this skill level? This cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
  };

  const addSkillInput = () => {
    setSkills([...skills, ""]);
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Group skills by parent for tree view
  const rootLevels = skillTree?.filter((level) => !level.parentId) || [];

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Skill Tree Management</h1>
        <button onClick={() => router.push("/manager")} className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>

      {/* Team Selector */}
      <div className="mb-6 rounded-lg border bg-white p-6">
        <label className="mb-2 block text-sm font-medium">Select Team</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={selectedTeamId || ""}
          onChange={(e) => setSelectedTeamId(Number(e.target.value) || null)}>
          <option value="">-- Select a team --</option>
          {teams?.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTeamId && (
        <>
          {/* Add Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              + Add Skill Level
            </button>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">{editingLevel ? "Edit" : "Add"} Skill Level</h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Beginner 1"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    className="w-full rounded border px-3 py-2"
                    rows={2}
                  />
                </div>

                {/* Parent Level */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Parent Level</label>
                  <select
                    value={parentId || ""}
                    onChange={(e) => setParentId(e.target.value || null)}
                    className="w-full rounded border px-3 py-2">
                    <option value="">-- None (Root Level) --</option>
                    {skillTree?.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-16 rounded border"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1 rounded border px-3 py-2"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Skills <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => updateSkill(index, e.target.value)}
                          placeholder={`Skill #${index + 1}`}
                          className="flex-1 rounded border px-3 py-2"
                        />
                        {skills.length > 1 && (
                          <button
                            onClick={() => removeSkill(index)}
                            className="px-3 text-red-600 hover:text-red-700">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addSkillInput} className="mt-2 text-sm text-blue-600 hover:underline">
                    + Add Another Skill
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
                    {editingLevel ? "Update" : "Create"} Level
                  </button>
                  <button
                    onClick={resetForm}
                    className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skill Tree Display */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Current Skill Levels</h2>

            {rootLevels.length === 0 ? (
              <div className="rounded-lg border bg-white p-12 text-center">
                <div className="mb-4 text-6xl">📚</div>
                <h3 className="mb-2 text-xl font-semibold">No Skill Levels Yet</h3>
                <p className="text-gray-600">Click "Add Skill Level" to get started.</p>
              </div>
            ) : (
              rootLevels.map((level) => (
                <div key={level.id}>
                  {/* Root Level */}
                  <div
                    className="rounded-lg border bg-white p-4"
                    style={{ borderLeftWidth: "4px", borderLeftColor: level.color || "#3b82f6" }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{level.name}</h3>
                        {level.description && <p className="text-sm text-gray-600">{level.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(level.skills as string[]).map((skill, idx) => (
                            <span key={idx} className="rounded bg-gray-100 px-2 py-1 text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(level)}
                          className="text-sm text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(level.id)}
                          className="text-sm text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Child Levels */}
                  {level.children && level.children.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                      {level.children.map((child: any) => (
                        <div
                          key={child.id}
                          className="rounded-lg border border-l-4 bg-white p-3"
                          style={{ borderLeftColor: child.color || "#6b7280" }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{child.name}</h4>
                              {child.description && (
                                <p className="text-sm text-gray-600">{child.description}</p>
                              )}
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(child.skills as string[]).map((skill: string, idx: number) => (
                                  <span key={idx} className="rounded bg-gray-100 px-2 py-1 text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(child)}
                                className="text-sm text-blue-600 hover:underline">
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(child.id)}
                                className="text-sm text-red-600 hover:underline">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!selectedTeamId && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <div className="mb-4 text-6xl">👆</div>
          <h2 className="mb-2 text-xl font-semibold">Select a Team</h2>
          <p className="text-gray-600">Choose a team above to manage skill levels.</p>
        </div>
      )}
    </main>
  );
}
