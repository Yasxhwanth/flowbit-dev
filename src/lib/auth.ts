import { checkout,polar,portal} from "@polar-sh/better-auth"
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";
import {polarClient} from "./polar";


export const auth = betterAuth({
  database:prismaAdapter(prisma,{
    provider:"postgresql",
  }),
  emailAndPassword:{
    enabled:true,
    autoSignIn:true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "8434e9a0-e9ea-431b-a5da-b30cace4372b",
              slug: "pro",
            },
          ],
          successUrl:process.env.POLAR_SUCCESS_URL,
          authenticatedUsersOnly:true,
        }),
        portal(),
      ],
    }),
  ],
});