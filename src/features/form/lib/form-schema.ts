import { z } from 'zod'

// --- Validation Schema ---
export const paymentSchema = z.object({
	method: z.string().optional(),
	amount: z.coerce
		.number({ invalid_type_error: 'El monto debe ser un número' })
		.min(0, 'El monto debe ser un número positivo o cero.')
		.optional(),
	reference: z.string().optional(),
})

export const formSchema = z.object({
	fullName: z
		.string()
		.min(1, 'Nombre completo es requerido')
		.regex(/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/, 'Nombre solo debe contener letras y espacios'),
	idNumber: z
		.string()
		.min(1, 'La cédula es requerida')
		.regex(/^[0-9]+$/, 'Cédula solo debe contener números'),
	phone: z
		.string()
		.min(1, 'El número de teléfono es requerido')
		.max(15, 'El número de teléfono no puede tener más de 15 caracteres')
		.regex(/^[0-9-+\s()]+$/, 'El teléfono solo puede contener números, guiones, espacios, paréntesis y el símbolo +'),
	ageValue: z
		.number({
			required_error: 'La edad es requerida.',
			invalid_type_error: 'La edad debe ser un número.',
		})
		.min(0, 'La edad debe ser un número positivo')
		.max(150, 'La edad no puede ser mayor a 150'),
	ageUnit: z
		.enum(['MESES', 'AÑOS'], {
			required_error: 'Debe seleccionar la unidad de edad.',
		}),
	email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
	registrationDate: z.date({ required_error: 'La fecha de registro es requerida.' }),
	examType: z.string().min(1, 'El tipo de exámen es requerido'),
	origin: z
		.string()
		.min(1, 'El origen es requerido')
		.regex(/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/, 'Procedencia solo debe contener letras y espacios'),
	treatingDoctor: z
		.string()
		.min(1, 'El médico tratante es requerido')
		.regex(/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/, 'Médico tratante solo debe contener letras y espacios'),
	sampleType: z
		.string()
		.min(1, 'El tipo de muestra es requerido')
		.regex(/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/, 'Tipo de muestra solo debe contener letras y espacios'),
	numberOfSamples: z.coerce
		.number({ invalid_type_error: 'El número de muestras es requerido' })
		.int()
		.positive('El número debe ser positivo')
		.min(1, 'El número de muestras es requerido'),
	relationship: z.string().optional(),
	branch: z.string().min(1, 'La sede es requerida'),
	totalAmount: z.coerce
		.number({ invalid_type_error: 'El monto total es requerido' })
		.min(0.01, 'El monto total debe ser mayor a cero'),
	payments: z.array(paymentSchema).optional().default([]),
	comments: z.string().optional(),
})

export type FormValues = z.infer<typeof formSchema>