// If you need to udpate this type, make sure to also update
// components/ProtectedRoute
// endpoints/auth/login_with_password_POST
// endpoints/auth/register_with_password_POST
// endpoints/auth/session_GET
// helpers/getServerUserSession
// together with this in one toolcall.

import { UserStatus } from "./schema";

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  // adjust this as necessary
  role: "admin" | "user" | "business";
  status: UserStatus;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  nationalId: string | null;
}
