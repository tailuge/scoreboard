import { NchanPub } from '../../nchan/nchanpub';

describe('NchanPub', () => {
    let pub: NchanPub;
    const channel = 'test-channel';

    beforeEach(() => {
        pub = new NchanPub(channel);
        // Mock global fetch
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should construct with correct publishUrl', () => {
        expect(pub['publishUrl']).toContain(`billiards-network.onrender.com/publish/lobby/${channel}`);
    });

    it('post should send data to the correct URL', async () => {
        const event = { type: 'test' };
        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue({ success: true }),
        });

        const result = await pub.post(event);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`billiards-network.onrender.com/publish/lobby/${channel}`),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(event),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            })
        );
        expect(result).toEqual({ success: true });
    });

    it('get should fetch active connections', async () => {
        const mockText = 'Active connections: 42';
        (global.fetch as jest.Mock).mockResolvedValue({
            text: jest.fn().mockResolvedValue(mockText),
        });

        const connections = await pub.get();

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('billiards-network.onrender.com/basic_status'),
            expect.objectContaining({
                method: 'GET',
                mode: 'cors',
            })
        );
        // The code does lines - 1
        expect(connections).toBe(41);
    });

    it('get should return 0 if regex does not match', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            text: jest.fn().mockResolvedValue('No connections info here'),
        });

        const connections = await pub.get();

        expect(connections).toBe(0);
    });
});
