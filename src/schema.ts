import type { AuthPluginSchema } from "better-auth";

export const schema = {
  fingerprint: {
    fields: {
      fingerprintId: {
        type: "string",
        unique: true,
        required: true,
      },
      createdAt: {
        type: "date",
        required: true,
      },
      updatedAt: {
        type: "date",
        required: true,
      },
      lastSeenAt: {
        type: "date",
      },
      ipAddresses: {
        type: "string[]",
      },
      flagged: {
        type: "boolean",
        required: true,
      },
      trustScore: {
        type: "number",
        required: true,
      },
      fingerprintData: {
        // @ts-ignore It doesn't expose the json type as its not integrated into every adapter yet
        type: "json",
        required: true,
      },
      users: {
        type: "string[]",
        defaultValue: [],
        references: {
          model: "user",
          field: "id",
          onDelete: "cascade",
        },
      },
    },
  },
} satisfies AuthPluginSchema;
