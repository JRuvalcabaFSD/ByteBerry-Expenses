import { ValueObjectError } from '@domain';

export class JwtTokenVO {
	private readonly value: string;

	private constructor(token: string) {
		this.value = token;
	}

	public static create(token: string): JwtTokenVO {
		if (!token || typeof token !== 'string') throw new ValueObjectError('Token must be a non-empty string');
		const parts = token.split('.');
		if (parts.length !== 3) throw new ValueObjectError('Invalid JWT format: must have 3 parts');
		return new JwtTokenVO(token);
	}

	/**
	 * Returns the JWT token value as a string.
	 *
	 * @returns {string} The JWT token.
	 */

	public getValue(): string {
		return this.value;
	}
}
