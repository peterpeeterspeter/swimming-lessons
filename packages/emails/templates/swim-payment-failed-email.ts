import type { TFunction } from "i18next";

import { EMAIL_FROM_NAME } from "@calcom/lib/constants";

import renderEmail from "../src/renderEmail";
import BaseEmail from "./_base-email";

export interface PaymentFailedInput {
  swimmerName: string;
  lessonName: string;
  parentEmail: string;
  parentName: string;
  amount: number;
  failureReason?: string;
  t: TFunction;
}

export default class SwimPaymentFailedEmail extends BaseEmail {
  input: PaymentFailedInput;

  constructor(input: PaymentFailedInput) {
    super();
    this.name = "SWIM_PAYMENT_FAILED";
    this.input = input;
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: this.input.parentEmail,
      from: `${EMAIL_FROM_NAME} <${this.getMailerOptions().from}>`,
      subject: this.input.t("swim_payment_failed_subject", {
        swimmerName: this.input.swimmerName,
      }),
      html: await renderEmail("SwimPaymentFailedEmail", this.input),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(): string {
    const { parentName, swimmerName, lessonName, amount, failureReason, t } = this.input;

    let text = `${t("swim_payment_failed_greeting", { parentName })}\n\n`;
    text += `${t("swim_payment_failed_notice")} ${swimmerName}'s ${lessonName}.\n\n`;
    text += `${t("amount")}: $${amount.toFixed(2)}\n`;

    if (failureReason) {
      text += `${t("reason")}: ${failureReason}\n`;
    }

    text += `\n${t("swim_payment_please_update")}\n`;
    text += `${t("swim_payment_enrollment_may_suspend")}\n\n`;
    text += `${t("questions_contact_school")}`;

    return text;
  }
}
