import type { TFunction } from "i18next";

import { EMAIL_FROM_NAME } from "@calcom/lib/constants";

import renderEmail from "../src/renderEmail";
import BaseEmail from "./_base-email";

export interface ProgressWeeklyInput {
  swimmerName: string;
  parentEmail: string;
  parentName: string;
  weekStart: Date;
  weekEnd: Date;
  attendanceCount: number;
  totalLessons: number;
  progressNotes: Array<{
    date: Date;
    instructor: string;
    note: string;
    skills?: string[];
  }>;
  t: TFunction;
}

export default class SwimProgressWeeklyEmail extends BaseEmail {
  input: ProgressWeeklyInput;

  constructor(input: ProgressWeeklyInput) {
    super();
    this.name = "SWIM_PROGRESS_WEEKLY";
    this.input = input;
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: this.input.parentEmail,
      from: `${EMAIL_FROM_NAME} <${this.getMailerOptions().from}>`,
      subject: this.input.t("swim_progress_weekly_subject", {
        swimmerName: this.input.swimmerName,
      }),
      html: await renderEmail("SwimProgressWeeklyEmail", this.input),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(): string {
    const { parentName, swimmerName, weekStart, weekEnd, attendanceCount, totalLessons, progressNotes, t } =
      this.input;

    let text = `${t("swim_progress_greeting", { parentName })}\n\n`;
    text += `${t(
      "swim_progress_summary"
    )} ${swimmerName} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}):\n\n`;
    text += `${t("lessons_attended")}: ${attendanceCount}/${totalLessons}\n\n`;

    if (progressNotes.length > 0) {
      text += `${t("instructor_notes")}:\n`;
      progressNotes.forEach((note) => {
        text += `\n${note.date.toLocaleDateString()} - ${note.instructor}:\n`;
        text += `${note.note}\n`;
        if (note.skills && note.skills.length > 0) {
          text += `${t("skills_practiced")}: ${note.skills.join(", ")}\n`;
        }
      });
    } else {
      text += `${t("no_progress_notes_this_week")}\n`;
    }

    text += `\n${t("view_full_progress_portal")}\n`;
    text += `${t("questions_contact_school")}`;

    return text;
  }
}
