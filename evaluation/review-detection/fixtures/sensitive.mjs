// Deliberately defective evaluation input. Only synthetic values are used in tests.
export async function connectAccount(input, provider, outputs) {
  try {
    return await provider(input.token);
  } catch (error) {
    const detail = { token: input.token, email: input.email, message: error.message };
    outputs.log(detail);
    outputs.telemetry({ event: 'connect-failed', detail });
    return { status: 502, body: detail };
  }
}
