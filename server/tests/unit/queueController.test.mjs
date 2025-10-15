import { jest } from '@jest/globals';

// Mock del servizio
const mockNextCustomer = jest.fn();

jest.unstable_mockModule('../../services/queueService.js', () => ({
  nextCustomer: mockNextCustomer
}));

const { handleNextCustomer } = await import('../../controllers/queueController.mjs');

describe('queueController - handleNextCustomer', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { counterId: '5' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return 404 if counter not found (null result)', async () => {
    mockNextCustomer.mockResolvedValue(null);

    await handleNextCustomer(req, res);

    expect(mockNextCustomer).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Counter not found' });
  });

  it('should return 404 if no customers in queue', async () => {
    mockNextCustomer.mockResolvedValue({ customerServed: false });

    await handleNextCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Queue is empty' });
  });

  it('should return the customer served result when a customer is served', async () => {
    const result = { customerServed: true, ticketNumber: 10 };
    mockNextCustomer.mockResolvedValue(result);

    await handleNextCustomer(req, res);

    // Il controller non chiama più res.status(200) esplicitamente
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it('should return 500 on unhandled errors', async () => {
    const err = new Error('Unexpected');
    mockNextCustomer.mockRejectedValue(err);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await handleNextCustomer(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Unexpected'
    });

    consoleSpy.mockRestore();
  });
});
