/** Inputs for the self-service profile feature (mirrors BE DTOs). */
export interface UpdateProfileInput {
  name: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
