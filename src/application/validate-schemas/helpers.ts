/* eslint-disable @typescript-eslint/no-explicit-any */
import z from 'zod';
import { ErrorList } from '@shared';

export function formattedZodError(error: z.ZodError, format: 'text'): { msg: string };
export function formattedZodError(error: z.ZodError, format: 'form'): { msg: string; errors: any[] };
export function formattedZodError(error: z.ZodError, format: 'form' | 'text'): { msg: string } | { msg: string; errors: any[] } {
	if (format === 'text') {
		const { fieldErrors } = z.flattenError(error);
		const todosMensajes = Object.values(fieldErrors).flat();
		return { msg: (todosMensajes[0] as string) ?? 'Error de validación' };
	}

	// Rama "form": lista detallada de errores por campo
	const errorList = error.issues.reduce<ErrorList[]>((acc, issue) => {
		const field = issue.path.join('.') || 'general';
		const errorDetail: any = {
			field,
			msg: issue.message,
		};

		// Si es un error de fecha o tipo, añadimos contexto extra
		if (field.toLowerCase().includes('date')) {
			errorDetail.expectedFormat = 'ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)';
			errorDetail.examples = ['2026-01-14', '2026-01-14T16:30:00Z'];
		}

		// Lógica para agrupar errores en el mismo campo
		const found = acc.find((e) => e.field === field);
		if (found) {
			found.msg = Array.isArray(found.msg) ? [...found.msg, issue.message] : [found.msg, issue.message];
		} else {
			acc.push(errorDetail);
		}

		return acc;
	}, []);

	return {
		msg: 'Validation error',
		errors: errorList,
	};
}

export const requiredString = (campo: string) => {
	return z.string(`${campo} is required`).trim().min(1, `${campo} cannot be empty`);
};

export const requiredNumber = (campo: string, max: number) => {
	return z.preprocess(
		(val) => {
			if (typeof val === 'string') {
				return Number.parseInt(val);
			}

			return val;
		},
		z
			.number(`${campo} is required`)
			.int(`${campo} must be an integer (cents)`)
			.gt(0, `${campo} must be greater than zero`)
			.max(max, `${campo} exceeds maximum allowed ($999,999.99)`)
	);
};

export const stringISODate = (campo: string) => {
	return z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, `${campo} must be a valid ISO 8601 string`)
		.transform((val, ctx) => {
			const date = new Date(val);
			if (isNaN(date.getTime())) {
				ctx.addIssue({
					code: 'custom',
					message: `${campo} is not a valid date format`,
				});

				return z.NEVER;
			}
			return date;
		})
		.refine((date) => !isNaN(date.getTime()), `${campo} is Invalid date`)
		.refine((date) => date <= new Date(), `${campo} cannot be in the future`);
};
