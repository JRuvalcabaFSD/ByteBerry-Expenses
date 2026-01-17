import { string } from 'zod';
/* eslint-disable @typescript-eslint/no-explicit-any */
import z from 'zod';
import { ErrorList } from '@shared';
import strict from 'assert/strict';

export function formattedZodError(error: z.ZodError, format: 'text'): { msg: string };
export function formattedZodError(error: z.ZodError, format: 'form'): { msg: string; errors: any[] };
export function formattedZodError(error: z.ZodError, format: 'form' | 'text'): { msg: string } | { msg: string; errors: any[] } {
	if (format === 'text') {
		const { fieldErrors } = z.flattenError(error);
		const todosMensajes = Object.values(fieldErrors).flat();
		return { msg: (todosMensajes[0] as string) ?? 'Error de validación' };
	}

	// Rama "form": lista detallada de errores por field
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

		// Lógica para agrupar errores en el mismo field
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

export const requiredString = (field: string) => {
	return z.string(`${field} is required`).trim().min(1, `${field} cannot be empty`);
};

export const requiredNumber = (field: string, max: number) => {
	return z.preprocess(
		(val) => {
			if (typeof val === 'string') {
				return Number.parseInt(val);
			}

			return val;
		},
		z
			.number(`${field} is required`)
			.int(`${field} must be an integer (cents)`)
			.gt(0, `${field} must be greater than zero`)
			.max(max, `${field} exceeds maximum allowed ($999,999.99)`)
	);
};

export const stringISODate = (field: string) => {
	return z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, `${field} must be a valid ISO 8601 string`)
		.transform((val, ctx) => {
			const date = new Date(val);
			if (isNaN(date.getTime())) {
				ctx.addIssue({
					code: 'custom',
					message: `${field} is not a valid date format`,
				});

				return z.NEVER;
			}
			return date;
		})
		.refine((date) => !isNaN(date.getTime()), `${field} is Invalid date`)
		.refine((date) => date <= new Date(), `${field} cannot be in the future`);
};

export const stringToNumber = (field: string) => {
	return z.preprocess(
		(val) => (val === undefined || val === '' ? undefined : Number(val)),
		z.number().int(`${field} must be a non-negative integer`).min(0, `${field} must be a non-negative integer`)
	);
};
