import { NextRequest } from 'next/server';
import handler from '@/pages/api/connected';
import { NchanPub } from '@/nchan/nchanpub';

// Mock NchanPub
jest.mock('@/nchan/nchanpub');

describe('/api/connected', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle GET requests', async () => {
        const req = {
            method: 'GET',
            url: 'http://localhost/api/connected',
        } as unknown as NextRequest;

        const postMock = jest.fn().mockResolvedValue({});
        (NchanPub as jest.Mock).mockImplementation(() => ({
            post: postMock,
        }));

        const response = await handler(req);

        // The global Response mock in jest.setup.ts doesn't implement instance .json(), so we parse the body directly.
        // The mock sets (this as any).body = body in constructor.
        const data = JSON.parse((response as any).body);

        expect(response?.status).toBe(200);
        expect(data).toEqual({ success: true });
        expect(NchanPub).toHaveBeenCalledWith('lobby');
        expect(postMock).toHaveBeenCalledWith({ action: 'connected' });
    });

    it('should ignore non-GET requests', async () => {
        const req = {
            method: 'POST',
            url: 'http://localhost/api/connected',
        } as unknown as NextRequest;

        const response = await handler(req);

        expect(response).toBeUndefined();
    });
});
