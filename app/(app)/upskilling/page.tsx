"use client";

import { useEffect, useState } from "react";
import { collection, query, where, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { COURSE_CATALOG } from "@/lib/data/courses";
import { createCustomCourse, deleteCustomCourse } from "@/lib/firestore/courses";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import type { CourseCompletion, Course } from "@/lib/types";
import { Clock, CheckCircle2, Plus, Trash2 } from "lucide-react";

export default function UpskillingPage() {
  const { activeOrgId, firebaseUser, profile, activeRole } = useAuth();
  const [completions, setCompletions] = useState<CourseCompletion[] | null>(null);
  const [customCourses, setCustomCourses] = useState<Course[] | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [durationHours, setDurationHours] = useState("1");
  const [creating, setCreating] = useState(false);
  const canManageCourses = activeRole === "admin" || activeRole === "owner";

  useEffect(() => {
    if (!activeOrgId) return;
    return onSnapshot(
      query(collection(db, "courseCompletions"), where("orgId", "==", activeOrgId)),
      (snap) => setCompletions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseCompletion)),
      () => setCompletions([])
    );
  }, [activeOrgId]);

  useEffect(() => {
    if (!activeOrgId) return;
    return onSnapshot(
      collection(db, "organizations", activeOrgId, "customCourses"),
      (snap) => setCustomCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Course)),
      () => setCustomCourses([])
    );
  }, [activeOrgId]);

  // Global static catalog + this org's own added courses, merged into one list.
  const allCourses: Course[] = [...COURSE_CATALOG, ...(customCourses ?? [])];

  const myCompletions = completions?.filter((c) => c.userId === firebaseUser?.uid) ?? [];
  const completedIds = new Set(myCompletions.map((c) => c.courseId));
  const progressPct = allCourses.length > 0 ? Math.round((myCompletions.length / allCourses.length) * 100) : 0;

  const leaderboard = Object.entries(
    (completions ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.userId] = (acc[c.userId] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  async function markComplete(courseId: string) {
    if (!activeOrgId || !firebaseUser) return;
    setMarking(courseId);
    try {
      await addDoc(collection(db, "courseCompletions"), {
        orgId: activeOrgId,
        userId: firebaseUser.uid,
        courseId,
        completedAt: new Date().toISOString(),
      });
    } finally {
      setMarking(null);
    }
  }

  async function onCreateCourse() {
    if (!activeOrgId || !firebaseUser || !title || !category) return;
    setCreating(true);
    try {
      await createCustomCourse({
        orgId: activeOrgId,
        userId: firebaseUser.uid,
        title,
        category,
        durationHours: Number(durationHours) || 1,
      });
      setTitle("");
      setCategory("");
      setDurationHours("1");
      setModalOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function onDeleteCourse(courseId: string) {
    if (!activeOrgId) return;
    await deleteCustomCourse(activeOrgId, courseId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-md">Welcome back{profile ? `, ${profile.displayName}` : ""}.</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            You&apos;re {progressPct}% through your Responsible AI certification pathway.
          </p>
        </div>
        {canManageCourses && (
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add course
          </Button>
        )}
      </div>

      <Card title="Certification Progress">
        <div className="h-2 rounded bg-surface-container-high overflow-hidden mb-2">
          <div className="h-full bg-secondary" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-label-sm text-on-surface-variant">
          {myCompletions.length} of {allCourses.length} courses complete
        </p>
      </Card>

      <Card title="Course Catalog">
        {completions === null || customCourses === null ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {allCourses.map((course) => {
              const done = completedIds.has(course.id);
              const isCustom = Boolean(course.orgId);
              return (
                <li key={course.id} className="border border-outline-variant rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <span className="text-label-sm text-tertiary uppercase">{course.category}</span>
                    {isCustom && canManageCourses && (
                      <button
                        type="button"
                        onClick={() => onDeleteCourse(course.id)}
                        aria-label={`Remove ${course.title}`}
                        className="text-on-surface-variant hover:text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <h4 className="font-medium mt-1 mb-2">
                    {course.title}
                    {isCustom && <span className="text-label-sm text-on-surface-variant ml-1.5">(org-added)</span>}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm text-on-surface-variant flex items-center gap-1">
                      <Clock size={14} /> {course.durationHours}h
                    </span>
                    {done ? (
                      <span className="text-secondary text-label-sm flex items-center gap-1">
                        <CheckCircle2 size={14} /> Complete
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => markComplete(course.id)}
                        disabled={marking === course.id}
                      >
                        {marking === course.id ? "Saving..." : "Mark complete"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Team Leaderboard">
        {leaderboard.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No completions yet this period.</p>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map(([userId, count], i) => (
              <li key={userId} className="flex items-center justify-between text-body-md">
                <span>
                  {i + 1}. {userId === firebaseUser?.uid ? `${profile?.displayName ?? "You"} (You)` : userId.slice(0, 8)}
                </span>
                <span className="font-medium">{count} course{count === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Add a course"
        onClose={() => setModalOpen(false)}
        onConfirm={onCreateCourse}
        confirmLabel={creating ? "Adding..." : "Add course"}
      >
        <div className="space-y-3 text-left">
          <div>
            <label htmlFor="courseTitle" className="block text-label-sm mb-1">
              TITLE
            </label>
            <input
              id="courseTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-outline-variant px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="courseCategory" className="block text-label-sm mb-1">
              CATEGORY
            </label>
            <input
              id="courseCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-outline-variant px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="courseDuration" className="block text-label-sm mb-1">
              DURATION (HOURS)
            </label>
            <input
              id="courseDuration"
              type="number"
              min="0.5"
              step="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full rounded border border-outline-variant px-3 py-2"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
