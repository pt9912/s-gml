import validate from 'xsd-validator';
import { validateGml } from '../src/validator.js';

jest.mock('xsd-validator');

const validateMock = validate as unknown as jest.MockedFunction<(xml: string, schema: string) => Promise<true | any[]>>;

describe('validateGml', () => {
    it('returns true when xsd-validator resolves to true', async () => {
        validateMock.mockResolvedValueOnce(true);
        await expect(validateGml('<xml/>', '3.2')).resolves.toBe(true);
    });

    it('returns false when xsd-validator resolves to errors', async () => {
        validateMock.mockResolvedValueOnce([{ message: 'error' }]);
        await expect(validateGml('<xml/>', '3.2')).resolves.toBe(false);
    });

    it('throws for unsupported version', async () => {
        await expect(validateGml('<xml/>', '1.0')).rejects.toThrow('Unsupported GML version');
    });
});
