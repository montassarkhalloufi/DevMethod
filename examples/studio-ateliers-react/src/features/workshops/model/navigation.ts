export function opensWorkshopForm(search: string, workshopId: string): boolean {
  const params = new URLSearchParams(search);
  return params.get('form') === 'join' && params.get('workshop') === workshopId;
}
