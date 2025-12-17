import type { TFunction } from "i18next";

import { EMAIL_FROM_NAME } from "@calcom/lib/constants";

import renderEmail from "../src/renderEmail";
import BaseEmail from "./_base-email";

export interface LessonCancelledInput {
  swimmerName: string;
  lessonName: string;
  parentEmail: string;
  parentName: string;
  originalDate: Date;
  cancelledBy: string;
  reason?: string;
  makeupOffered?: boolean;
  t: TFunction;
}

export default class SwimLessonCancelledEmail extends BaseEmail {
  input: LessonCancelledInput;

  constructor(input: LessonCancelledInput) {
    super();
    this.name = "SWIM_LESSON_CANCELLED";
    this.input = input;
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: this.input.parentEmail,
      from: `${EMAIL_FROM_NAME} <${this.getMailerOptions().from}>`,
      subject: this.input.t("swim_lesson_cancelled_subject", {
        lessonName: this.input.lessonName,
        date: this.input.originalDate.toLocaleDateString(),
      }),
      html: await renderEmail("SwimLessonCancelledEmail", this.input),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(): string {
    const { parentName, swimmerName, lessonName, originalDate, cancelledBy, reason, makeupOffered, t } =
      this.input;

    let text = `${t("swim_lesson_cancelled_greeting", { parentName })}\n\n`;
    text += `${t("swim_lesson_cancelled_notice")} ${swimmerName}'s ${lessonName} ${t(
      "on"
    )} ${originalDate.toLocaleDateString()}.\n\n`;
    text += `${t("cancelled_by")}: ${cancelledBy}\n`;

    if (reason) {
      text += `${t("reason")}: ${reason}\n`;
    }

    if (makeupOffered) {
      text += `\n${t("swim_makeup_lesson_available")}\n`;
    }

    text += `\n${t("questions_contact_school")}`;

    return text;
  }
}
