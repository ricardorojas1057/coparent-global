import { createBodySizeGuard, createRateLimitMiddleware } from './security.middleware';

describe('security middleware', () => {
  it('limits repeated authentication attempts', () => {
    const middleware = createRateLimitMiddleware(() => 1_000);
    const request = { ip: '127.0.0.1', method: 'POST', path: '/auth/login' };
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    for (let attempt = 0; attempt < 11; attempt += 1) {
      middleware(request as never, response as never, next);
    }

    expect(response.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(10);
  });

  it('rejects declared bodies above the configured limit', () => {
    const middleware = createBodySizeGuard(100);
    const request = { headers: { 'content-length': '101' } };
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    middleware(request as never, response as never, next);

    expect(response.status).toHaveBeenCalledWith(413);
    expect(next).not.toHaveBeenCalled();
  });
});
