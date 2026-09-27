// Client-safe password rule shared by the sign-up/reset forms and server validators.
// 8 characters follows NIST SP 800-63B for user-chosen passwords; Supabase Auth's
// own "Minimum password length" setting must not be set higher than this.
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
