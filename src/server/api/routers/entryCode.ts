import { EntryCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env.mjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const entryCodeRouter = createTRPCRouter({
  getAllCodesForProperty: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const codes = await ctx.prisma.entryCode.findMany({
        where: {
          propertySlug: input.slug,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return codes;
    }),
  createCode: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        name: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isValidCode(input.code)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Code must be a number between 4 and 8 digits long.`,
        });
      }

      const codesForProperty = await ctx.prisma.entryCode.findMany({
        where: {
          propertySlug: input.slug,
        },
        orderBy: {
          codeSlot: "asc",
        },
      });

      const newCodeSlot = findNextAvailableCodeSlot(codesForProperty);

      try {
        const response = await fetch(
          `https://${input.slug}.duckdns.org:8123/api/services/zwave_js/set_lock_usercode`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${slugToToken(input.slug)}`,
            },
            body: JSON.stringify({
              entity_id:
                input.slug === "the-twins-villa"
                  ? "lock.smart_lock"
                  : "lock.front_door",
              code_slot: newCodeSlot,
              usercode: parseInt(input.code),
            }),
          }
        );

        console.log(response);

        if (!response.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "" + response.status,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        } else {
          // Handle or rethrow the error if it's not an instance of Error
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
          });
        }
      }

      return await ctx.prisma.entryCode.create({
        data: {
          name: input.name,
          code: input.code,
          propertySlug: input.slug,
          codeSlot: newCodeSlot,
        },
      });
    }),
  deleteCode: publicProcedure
    .input(
      z.object({
        codeId: z.string(),
        slug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = await ctx.prisma.entryCode.findFirst({
        where: {
          id: input.codeId,
        },
      });

      if (!code) {
        return;
      }

      try {
        const response = await fetch(
          `https://${input.slug}.duckdns.org:8123/api/services/zwave_js/clear_lock_usercode`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${slugToToken(input.slug)}`,
            },
            body: JSON.stringify({
              entity_id:
                input.slug === "the-twins-villa"
                  ? "lock.smart_lock"
                  : "lock.front_door",
              code_slot: code.codeSlot,
            }),
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "" + response.status,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        } else {
          // Handle or rethrow the error if it's not an instance of Error
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
          });
        }
      }

      return await ctx.prisma.entryCode.delete({
        where: {
          id: input.codeId,
        },
      });
    }),
});

// Codes must be between 4 and 8 digits long and only contain numbers
function isValidCode(code: string) {
  const isNumeric = /^\d+$/.test(code); // Check if the code contains only numbers
  return isNumeric && code.length >= 4 && code.length <= 8;
}

function findNextAvailableCodeSlot(codes: EntryCode[]) {
  const maxSlot = 49;

  const takenSlots: boolean[] = Array(maxSlot).fill(false) as boolean[];;

  for (const code of codes) {
    if (code.codeSlot >= 1 && code.codeSlot <= maxSlot) {
      takenSlots[code.codeSlot - 1] = true;
    }
  }

  for (let i = 0; i < maxSlot; i++) {
    if (!takenSlots[i]) {
      return i + 1; // +1 to convert from 0-based index to 1-based slot number
    }
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `There can only be a maximum of 50 codes per property.`,
  });
}

function slugToToken(slug: string): string {
  switch (slug) {
    case "villa-aviator":
      return env.HA_TOKEN_VILLA_AVIATOR;
    case "villa-encore":
      return env.HA_TOKEN_VILLA_ENCORE;
    case "the-twins-villa":
      return env.HA_TOKEN_THE_TWINS_VILLA;
    case "maya-serenity":
      return env.HA_TOKEN_MAYA_SERENITY;
    default:
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `No Home Assistant API token found for slug ${slug}`,
      });
  }
}
