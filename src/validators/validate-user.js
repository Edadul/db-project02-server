import { userSchema } from "../models/db-schemas.js"

export const validateUser = (object) => {
  return userSchema.safeParse(object)
}