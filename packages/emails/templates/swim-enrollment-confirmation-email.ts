import type { TFunction } from "i18next";

import { EMAIL_FROM_NAME } from "@calcom/lib/constants";

import renderEmail from "../src/renderEmail";
import BaseEmail from "./_base-email";

export interface EnrollmentConfirmationInput {
  swimmerName: string;
  lessonName: string;
  parentEmail: string;
  parentName: string;
  startDate: Date;
  paymentAmount?: number;
  paymentFrequency?: string;
  nextPaymentDate?: Date;
  t: TFunction;
}

export default class SwimEnrollmentConfirmationEmail extends BaseEmail {
  input: EnrollmentConfirmationInput;

  constructor(input: EnrollmentConfirmationInput) {
    super();
    this.name = "SWIM_ENROLLMENT_CONFIRMATION";
    this.input = input;
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: this.input.parentEmail,
      from: `${EMAIL_FROM_NAME} <${this.getMailerOptions().from}>`,
      subject: this.input.t("swim_enrollment_confirmed_subject", {
        swimmerName: this.input.swimmerName,
        lessonName: this.input.lessonName,
      }),
      html: await renderEmail("SwimEnrollmentConfirmationEmail", this.input),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(): string {
    const { swimmerName, lessonName, startDate, paymentAmount, paymentFrequency, nextPaymentDate, t } =
      this.input;

    let text = `${t("swim_enrollment_confirmed_greeting", { parentName: this.input.parentName })}\n\n`;
    text += `${swimmerName} ${t("swim_enrollment_confirmed_enrolled")} ${lessonName}.\n\n`;
    text += `${t("start_date")}: ${startDate.toLocaleDateString()}\n`;

    if (paymentAmount && paymentFrequency) {
      text += `\n${t("payment_details")}:\n`;
      text += `${t("amount")}: $${paymentAmount.toFixed(2)}\n`;
      text += `${t("frequency")}: ${paymentFrequency}\n`;
      if (nextPaymentDate) {
        text += `${t("next_payment")}: ${nextPaymentDate.toLocaleDateString()}\n`;
      }
    }

    text += `\n${t("swim_enrollment_access_portal")}\n`;
    text += `\n${t("questions_contact_school")}`;

    return text;
  }
}
