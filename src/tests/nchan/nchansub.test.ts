import { NchanSub } from '../../nchan/nchansub';

// Mock WebSocket
class MockWebSocket {
    onopen: () => void = () => { };
    onmessage: (event: MessageEvent) => void = () => { };
    onerror: (error: Event) => void = () => { };
    onclose: (event: CloseEvent) => void = () => { };
    close = jest.fn();
    send = jest.fn();

    constructor(public url: string) { }
}

global.WebSocket = MockWebSocket as any;

describe('NchanSub', () => {
    let sub: NchanSub;
    const channel = 'test-channel';
    const notifyMock = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
        sub = new NchanSub(channel, notifyMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        sub.stop(); // Ensure cleanup
    });

    it('should construct with correct subscribeUrl', () => {
        expect(sub['subscribeUrl']).toContain(`billiards-network.onrender.com/subscribe/lobby/${channel}`);
    });

    it('start should create a WebSocket connection', () => {
        sub.start();
        expect(sub['socket']).toBeInstanceOf(MockWebSocket);
    });

    it('should handle incoming messages', () => {
        sub.start();
        const mockSocket = sub['socket'] as unknown as MockWebSocket;
        const messageEvent = { data: 'test-message' } as MessageEvent;

        // Simulate onmessage
        mockSocket.onmessage(messageEvent);

        expect(notifyMock).toHaveBeenCalledWith('test-message');
    });

    it('should attempt to reconnect on close if shouldReconnect is true', () => {
        sub.start();
        const mockSocket = sub['socket'] as unknown as MockWebSocket;
        const closeEvent = { reason: 'test-close' } as CloseEvent;

        // Simulate onclose
        mockSocket.onclose(closeEvent);

        // Fast-forward time
        jest.advanceTimersByTime(30000);

        // Should have created a new socket (reconnected)
        // Since we can't easily spy on the constructor again without more complex mocking,
        // we can check if a new socket instance exists or check console logs if we spied on them.
        // However, simplest is to check if connect was called again.
        // We can spy on the private connect method by casting.
        // Let's retry this slightly differently by spying on connect before start.
    });

    it('should reconnect after timeout', () => {
        const connectSpy = jest.spyOn(sub as any, 'connect');
        sub.start();
        expect(connectSpy).toHaveBeenCalledTimes(1);

        const mockSocket = sub['socket'] as unknown as MockWebSocket;
        mockSocket.onclose({ reason: 'test' } as CloseEvent);

        expect(connectSpy).toHaveBeenCalledTimes(1); // Not yet
        jest.advanceTimersByTime(30000);
        expect(connectSpy).toHaveBeenCalledTimes(2);
    });

    it('stop should clear reconnect timeout and close socket', () => {
        sub.start();
        const mockSocket = sub['socket'] as unknown as MockWebSocket;

        sub.stop();

        expect(mockSocket.close).toHaveBeenCalled();
        expect(sub['socket']).toBeNull();
    });
});
