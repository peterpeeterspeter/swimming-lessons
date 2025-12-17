import type { TFunction } from "i18next";

import { EMAIL_FROM_NAME } from "@calcom/lib/constants";

import renderEmail from "../src/renderEmail";
import BaseEmail from "./_base-email";

export interface PaymentReminderInput {
  swimmerName: string;
  lessonName: string;
  parentEmail: string;
  parentName: string;
  amount: number;
  dueDate: Date;
  t: TFunction;
}

export default class SwimPaymentReminderEmail extends BaseEmail {
  input: PaymentReminderInput;

  constructor(input: PaymentReminderInput) {
    super();
    this.name = "SWIM_PAYMENT_REMINDER";
    this.input = input;
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: this.input.parentEmail,
      from: `${EMAIL_FROM_NAME} <${this.getMailerOptions().from}>`,
      subject: this.input.t("swim_payment_reminder_subject", {
        swimmerName: this.input.swimmerName,
      }),
      html: await renderEmail("SwimPaymentReminderEmail", this.input),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(): string {
    const { parentName, swimmerName, lessonName, amount, dueDate, t } = this.input;

    let text = `${t("swim_payment_reminder_greeting", { parentName })}\n\n`;
    text += `${t("swim_payment_reminder_upcoming")} ${swimmerName}'s ${lessonName}.\n\n`;
    text += `${t("amount")}: $${amount.toFixed(2)}\n`;
    text += `${t("due_date")}: ${dueDate.toLocaleDateString()}\n\n`;
    text += `${t("swim_payment_will_auto_charge")}\n\n`;
    text += `${t("swim_payment_update_method")}\n`;
    text += `${t("questions_contact_school")}`;

    return text;
  }
}
