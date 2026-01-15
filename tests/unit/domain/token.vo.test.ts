import { JwtTokenVO, ValueObjectError } from '@domain';

describe('JwtTokenVO', () => {
	describe('create', () => {
		it('should create a JwtTokenVO with a valid JWT token', () => {
			const validToken = 'header.payload.signature';
			const tokenVO = JwtTokenVO.create(validToken);
			expect(tokenVO).toBeInstanceOf(JwtTokenVO);
			expect(tokenVO.getValue()).toBe(validToken);
		});

		it('should throw ValueObjectError for null token', () => {
			expect(() => JwtTokenVO.create(null as any)).toThrow(ValueObjectError);
			expect(() => JwtTokenVO.create(null as any)).toThrow('Token must be a non-empty string');
		});

		it('should throw ValueObjectError for undefined token', () => {
			expect(() => JwtTokenVO.create(undefined as any)).toThrow(ValueObjectError);
			expect(() => JwtTokenVO.create(undefined as any)).toThrow('Token must be a non-empty string');
		});

		it('should throw ValueObjectError for empty string', () => {
			expect(() => JwtTokenVO.create('')).toThrow(ValueObjectError);
			expect(() => JwtTokenVO.create('')).toThrow('Token must be a non-empty string');
		});

		it('should throw ValueObjectError for non-string token', () => {
			expect(() => JwtTokenVO.create(123 as any)).toThrow(ValueObjectError);
			expect(() => JwtTokenVO.create(123 as any)).toThrow('Token must be a non-empty string');
		});

		it('should throw ValueObjectError for token with less than 3 parts', () => {
			expect(() => JwtTokenVO.create('header.payload')).toThrow(ValueObjectError);
			expect(() => JwtTokenVO.create('header.payload')).toThrow('Invalid JWT format: must have 3 parts');
		});

		it('should throw ValueObjectError for token with more than 3 parts', () => {
			expect(() => JwtTokenVO.create('header.payload.signature.extra')).toThrow(ValueObjectError);
			expect(() => JwtTokenVO.create('header.payload.signature.extra')).toThrow('Invalid JWT format: must have 3 parts');
		});

		it('should throw ValueObjectError for token with empty parts', () => {
			expect(() => JwtTokenVO.create('header..signature')).toThrow(ValueObjectError);
			expect(() => JwtTokenVO.create('header..signature')).toThrow('Invalid JWT format: must have 3 parts');
		});
	});

	describe('getValue', () => {
		it('should return the token value', () => {
			const token = 'header.payload.signature';
			const tokenVO = JwtTokenVO.create(token);
			expect(tokenVO.getValue()).toBe(token);
		});
	});
});
