# Usage Package Test Suite

This directory contains comprehensive Jest tests for the `@thrivereflections/realtime-usage` package.

## Test Coverage

The test suite covers:

### Per-Million Token Pricing

- ✅ 1M token tests for all token types (text input/output/cached, audio input/output/cached)
- ✅ Both `gpt-realtime` and `gpt-realtime-mini` models
- ✅ Exact pricing verification against OpenAI's published rates

### Pricing Model Validation

- ✅ All pricing rates are positive
- ✅ Full model is more expensive than mini model
- ✅ Pricing rates match expected values

### Cached Token Handling

- ✅ Cached tokens reduce input cost correctly
- ✅ Cached tokens exceeding input tokens are handled properly

### Tool Calls and Retrievals

- ✅ Tool call and retrieval overhead costs are calculated correctly

### Session Overhead

- ✅ Session and connection overhead are included in total cost

### Edge Cases

- ✅ Zero token usage (only overhead costs)
- ✅ Negative cached tokens (handled gracefully)

### CostEstimator Class

- ✅ Legacy CostEstimator class functionality
- ✅ Cost summary calculations

### getCostBreakdown Function

- ✅ Frontend cost breakdown function
- ✅ Detailed cost breakdown for all categories

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- **Per-Million Token Pricing**: Tests verify that 1M tokens cost exactly the published rate
- **Pricing Model Validation**: Tests ensure pricing models are correctly configured
- **Cached Token Handling**: Tests verify cached token logic works correctly
- **Tool Calls and Retrievals**: Tests verify overhead costs are applied
- **Session Overhead**: Tests verify session costs are included
- **Edge Cases**: Tests verify edge cases are handled gracefully
- **CostEstimator Class**: Tests verify legacy class functionality
- **getCostBreakdown Function**: Tests verify frontend integration function

## Coverage

Current test coverage for `costEstimator.ts`:

- **Statements**: 43.13%
- **Branches**: 6.89%
- **Functions**: 23.07%
- **Lines**: 47.31%

The tests focus on the core cost calculation logic and per-million token pricing functionality.
