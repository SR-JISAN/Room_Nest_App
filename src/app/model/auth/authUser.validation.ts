import z from "zod";


const allowedEmailDomains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
];

export const RegistrationValidationZODSchema = z.object({
  name: z
    .string("Use characters only")
    .min(3, "Name should be minimum 3 letters")
    .max(50, "Name should be maximum 50 letters")
    .regex(/^[A-Za-z\s]+$/, "Name can contain only letters and spaces"),

  email: z
    .email("Use a valid email")
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase();

        return allowedEmailDomains.includes(domain);
      },
      {
        message: "Please use a supported email provider",
      }
    ),

  password: z
    .string("Use a strong password")
    .min(6, "Password must contain minimum 6 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter")
    .regex(/[0-9]/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),

  profile: z
    .object({
      contactNumber: z
        .string("Use a valid contact number")
        .regex(
          /^01[3-9]\d{8}$/,
          "Please provide a valid Bangladesh contact number",
        )
        .optional(),
    })
    .optional(),
});

export const VerifyEmailZodSchema = z.object({
  email: z.email("Use a valid email").refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();

      return allowedEmailDomains.includes(domain);
    },
    {
      message: "Please use a supported email provider",
    },
  ),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});


export const LoginValidationZodSchema = z.object({
  email: z.email("Use a valid email").refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();

      return allowedEmailDomains.includes(domain);
    },
    {
      message: "Please use a supported email provider",
    },
  ),
  password: z
    .string("Use a strong password")
    .min(6, "Password must contain minimum 6 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter")
    .regex(/[0-9]/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),
});

export const UpdatePasswordZodSchema = z.object({
  currentPassword: z
    .string("Use a strong password")
    .min(6, "Password must contain minimum 6 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter")
    .regex(/[0-9]/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),
  newPassword: z
    .string("Use a strong password")
    .min(6, "Password must contain minimum 6 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter")
    .regex(/[0-9]/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),
  confirmPassword: z
    .string("Use a strong password")
    .min(6, "Password must contain minimum 6 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter")
    .regex(/[0-9]/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),
});
export const ResetPasswordZodSchema = z.object({
  email: z.email("Use a valid email").refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();

      return allowedEmailDomains.includes(domain);
    },
    {
      message: "Please use a supported email provider",
    },
  ),
})

export const ResetPasswordVerifiedZodSchema = z.object({
  otp: z
    .string("use valid otp")
    .length(6, "OTP must contain exactly 6 characters"),
  newPassword: z
    .string("Use a strong password")
    .min(6, "Password must contain minimum 6 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter")
    .regex(/[0-9]/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),
});


