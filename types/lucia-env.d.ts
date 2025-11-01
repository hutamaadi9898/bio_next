/// <reference types="lucia" />

declare namespace Lucia {
  type Auth = import("@/lib/auth/lucia").Auth;

  interface DatabaseUserAttributes {
    email: string;
  }

  interface DatabaseSessionAttributes {}
}
