import * as z from "zod";

// ============================================================
// UTILISATEUR
// ============================================================
export const SignupValidation = z.object({
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  username: z.string().min(2, { message: "Le nom d'utilisateur doit comporter au moins 2 caractères." }),
  email: z.string().email(),
  password: z.string().min(8, { message: "Le mot de passe doit comporter au moins 8 caractères." }),
});

export const SigninValidation = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: "Le mot de passe doit comporter au moins 8 caractères." }),
});

export const ProfileValidation = z.object({
  file: z.custom<File[]>(),
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  username: z.string().min(2, { message: "Le nom d'utilisateur doit comporter au moins 2 caractères." }),
  email: z.string().email(),
  bio: z.string(),
});

// ============================================================
// PUBLICATION
// ============================================================
export const PostValidation = z.object({
  caption: z.string().min(5, { message: "Minimum 5 caractères." }).max(2200, { message: "Maximum 2 200 caractères." }),
  file: z.custom<File[]>(),
  location: z.string().min(1, { message: "Ce champ est requis." }).max(1000, { message: "Maximum 1 000 caractères." }),
  tags: z.string(),
});