import { isAxiosError } from "axios";
import { api } from "../lib/api";

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string | null;
  avatarUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateProfileInput {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
}

export type UpdateProfileInput = Partial<CreateProfileInput>;

/** Returns null when the authenticated user has not completed the profile yet. */
export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const { data } = await api.get<UserProfile>("/users/me");
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createProfile(input: CreateProfileInput): Promise<UserProfile> {
  const { data } = await api.post<UserProfile>("/users", input);
  return data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>("/users/me", input);
  return data;
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/users/me");
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await api.get<{ available: boolean }>("/users/username-availability", {
    params: { username },
  });
  return data.available;
}
