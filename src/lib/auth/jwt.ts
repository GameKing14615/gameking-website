import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const key = new TextEncoder().encode(JWT_SECRET);

export interface AdminJwtPayload {
  sub: string; // admin UUID
  username: string;
  is_primary: boolean;
}

export async function signAccessToken(payload: AdminJwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h") // 8 hour expiration for access token
    .sign(key);
}

export async function verifyAccessToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as AdminJwtPayload;
  } catch {
    return null;
  }
}
