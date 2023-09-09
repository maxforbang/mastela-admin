/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style, @typescript-eslint/no-unsafe-call */

import { EmailTemplate } from "~/components/EmailTemplate";
import { Resend } from "resend";
import { env } from "~/env.mjs";
import { generateRandomCode } from "~/utils/functions/generateRandomCode";
import { entryCodeRouter } from "~/server/api/routers/entryCode";
import { prisma } from "./../../../server/db";
import { NextApiRequest, NextApiResponse } from "next";
import { Logger } from "next-axiom";

const resend = new Resend(env.RESEND_API_KEY);

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const webhookObjectResponse = req.body as LodgifyBookingWebhookObjectBody;
  const webhookObject = webhookObjectResponse[0] as LodgifyBookingWebhookObject;
  
  const trpcCaller = entryCodeRouter.createCaller({ prisma });
  const log = new Logger();

  if (!webhookObject) {
    log.warn("Received empty webhook body.");
    await log.flush();
    return res.status(400).json({ message: "Body is empty" });
  }

  const {
    action,
    booking: { property_name = "", property_internal_name = "" } = {},
    guest: { name = "", email = "", phone_number = "" } = {},
  } = webhookObject;

  if (action !== "booking_new_status_booked") {
    log.warn(
      "Booking received without Lodgify status booking_new_status_booked",
      { webhookObject }
    );
    await log.flush();
    return res
      .status(400)
      .json({
        message: "Lodigfy Webhook status unhandled",
        lodgifyWebhook: webhookObject,
      });
  }

  const entryCode = generateRandomCode(5);
  const firstName = name.split(" ")[0] ?? "";

  try {
    await trpcCaller.createCode({
      slug: property_internal_name,
      name,
      code: entryCode,
    });
  } catch (error) {
    log.error("Failed to create code.", { error });
    await log.flush();
    return res.status(400).json(error);
  }

  try {
    const data = await resend.emails.send({
      from: "Mastela Vacations <info@mastelavacations.com>",
      to: [email],
      subject: `Welcome to ${property_name}!`,
      react: EmailTemplate({
        name: firstName,
        entryCode,
        propertyName: property_name,
      }),
      text: "",
    });

    return res.status(200).json({
      message: `Successfully created a code for ${name} for ${property_name}. Go to mlvillas.com to view it.`,
    });
  } catch (error) {
    log.error("Failed to send email.", { error });
    await log.flush();
    return res.status(400).json(error);
  }
};

export default handler;
