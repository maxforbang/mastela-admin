// import { EntryCode } from "@prisma/client";
import { EmailTemplate } from "~/components/EmailTemplate";
import { Resend } from "resend";
import { env } from "~/env.mjs";
import { generateRandomCode } from "~/utils/functions/generateRandomCode";
import { entryCodeRouter } from "~/server/api/routers/entryCode";
import { prisma } from "./../../../server/db";
import { NextApiRequest, NextApiResponse } from "next";

const resend = new Resend(env.RESEND_API_KEY);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const trpcCaller = entryCodeRouter.createCaller({ prisma });

  const {
    action,
    booking: { property_name = "", property_internal_name = "" } = {},
    guest: { name = "", email = "", phone_number = "" } = {},
  } = req.body as LodgifyBookingWebhookObject;

  const entryCode = generateRandomCode(5);
  const firstName = name.split(" ")[0] ?? "";

  try {
    await trpcCaller.createCode({
      slug: property_internal_name,
      name,
      code: entryCode,
    });
  } catch (error) {
    res.status(400).json(error);
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

    res
      .status(200)
      .json({
        message: `Successfully created a code for ${name} for ${property_name}. Go to mlvillas.com to view it.`,
      });
  } catch (error) {
    res.status(400).json(error);
  }
}

export default handler;
