import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export function getPlaidClient() {
  const env = (process.env.PLAID_ENV || "sandbox") as keyof typeof PlaidEnvironments;
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
    },
  });
  return new PlaidApi(configuration);
}
