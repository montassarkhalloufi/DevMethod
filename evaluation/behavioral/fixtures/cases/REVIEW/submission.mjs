export async function submit(key, state, charge, notify) {
  if (state.has(key)) return state.get(key);
  const receipt = await charge(key);
  await notify(receipt);
  state.set(key, receipt);
  return receipt;
}
