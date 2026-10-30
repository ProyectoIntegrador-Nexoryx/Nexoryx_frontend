/** Predefined avatar gallery (files in public/avatars). The API accepts these paths or https URLs. */
export const AVATARS = [
  { url: "/avatars/avatar-01.svg", label: "Órbita violeta" },
  { url: "/avatars/avatar-02.svg", label: "Rombo cian" },
  { url: "/avatars/avatar-03.svg", label: "Pirámide lila" },
  { url: "/avatars/avatar-04.svg", label: "Eclipse azul" },
  { url: "/avatars/avatar-05.svg", label: "Mosaico índigo" },
  { url: "/avatars/avatar-06.svg", label: "Onda turquesa" },
  { url: "/avatars/avatar-07.svg", label: "Estrella rosa" },
  { url: "/avatars/avatar-08.svg", label: "Luna dorada" },
] as const;

export const DEFAULT_AVATAR_URL = AVATARS[0].url;
