"use client";

import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function createCustomCourse(params: {
  orgId: string;
  userId: string;
  title: string;
  category: string;
  durationHours: number;
}) {
  return addDoc(collection(db, "organizations", params.orgId, "customCourses"), {
    title: params.title,
    category: params.category,
    durationHours: params.durationHours,
    orgId: params.orgId,
    createdBy: params.userId,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteCustomCourse(orgId: string, courseId: string) {
  return deleteDoc(doc(db, "organizations", orgId, "customCourses", courseId));
}
