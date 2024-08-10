import { z } from "zod";

export const registerSchema = z.object({
    names: z.string({
        required_error: "Los nombres completos son obligatorios",
    }).min(2, {
        message: "Los nombres completos deben tener al menos 2 caracteres",
    }),
    cedulaRUC: z
        .string({
            required_error: "La identificación es obligatoria",
        })
        .min(10, {
            message: "La identificación debe tener al menos 10 caracteres",
        }) // Asumiendo un mínimo de 10 caracteres para identificación
        .max(13, {
            message: "La identificación no debe exceder los 13 caracteres",
        }), // Asumiendo un máximo de 13 caracteres para identificación
    password: z
        .string({
            required_error: "La contraseña es obligatoria",
        })
        .min(6, {
            message: "La contraseña debe tener al menos 6 caracteres",
        }),
    isAdmin: z.boolean().default(false),
});

export const loginSchema = z.object({
    cedulaRUC: z
        .string({
            required_error: "La identificación es obligatoria",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres",
    }),
});