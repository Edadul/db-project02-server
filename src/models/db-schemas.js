import z from 'zod'

export const userSchema = z.object({
  name: z.string().min(3).optional(),
  lastName: z.string().optional(),
  id: z.string().min(8).optional(),
  birthDate: z.string().date().optional(),
  age: z.number().int().min(16).max(120).optional(),
  address: z.string().optional(),
  email: z.string().min(3).includes('@').includes('.').optional(),
  password: z.string().min(8).optional(),
  rol: z.enum(['client', 'admin']).optional(),
})

export const productSchema = z.object({
  code: z.string().min(7).includes('-'),
  name: z.string().min(3),
  unitPrice: z.number().positive()
})
