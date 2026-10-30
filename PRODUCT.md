# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University students who study together remotely. They create private study rooms or join a classmate's room to chat, talk by audio/video and share their screen during a study session. Includes blind users who navigate with a screen reader and keyboard.

## Product Purpose

NEXORYX ("Beyond Connection.") is a real-time study and collaboration web app built for the Proyecto Integrador course at Universidad del Valle. Success: a student signs in, opens or joins a room and studies with others without friction.

## Capabilities and Constraints

- Accounts: email/password and Google sign-in (Firebase Auth). Every profile requires a unique username (3–20 chars, `a-z`, `0-9`, `_`), first and last name, and an avatar.
- Any valid email can register; no institutional-domain restriction.
- Session persistence: "Mantener la sesión iniciada" (persistent vs. tab-only session); no time-based "remember for N days".
- Rooms, chat, chat history, audio/video, mic/camera controls and screen sharing (US-06 to US-14).
- The frontend never reads Firestore directly; all data goes through the NestJS API.
- Spanish UI copy; code and identifiers in English.

## Brand Commitments

- Name NEXORYX, tagline "Beyond Connection." / "Más allá de la conexión."
- Login mock provided by the team (dark theme, Space Grotesk + Inter, violet `#a078ff`, cyan `#5de6ff`) is the binding visual reference for the authentication screens.

## Evidence on Hand

No usage metrics, testimonials or user counts exist. Do not fabricate figures (e.g. "+50K students"); describe real features instead.

## Product Principles

- Accessibility is a requirement, not polish: WCAG 2.2 AA, screen-reader first.
- Get students into a room fast; every extra step must justify itself.
- Honest copy: only claim what the app actually does.

## Accessibility & Inclusion

WCAG 2.2 AA (US-15). Lighthouse Accessibility ≥ 95 on auth views. Paste and password managers allowed on login (3.3.8). Strategy in `docs/accesibilidad-wcag.md`.
