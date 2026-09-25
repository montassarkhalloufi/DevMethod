export function ledger(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    return { format: 'loan-ledger-v1', objects: [], loans: [] };
  if (!value || value.format !== 'loan-ledger-v1' || !Array.isArray(value.objects) || !Array.isArray(value.loans))
    throw Error('Ce carnet contient un format inconnu. Les données sont préservées ; aucune réinitialisation automatique.');
  const ids = new Set(), numbers = new Set(), loanIds = new Set(), active = new Set();
  for (const object of value.objects) {
    if (!object || typeof object.id !== 'string' || ids.has(object.id) || typeof object.label !== 'string' || !object.label.trim() || typeof object.number !== 'string' || !object.number.trim() || numbers.has(object.number.toLocaleLowerCase('fr')))
      throw Error('Le carnet contient un objet incohérent. Aucune donnée remplacée.');
    ids.add(object.id); numbers.add(object.number.toLocaleLowerCase('fr'));
  }
  for (const loan of value.loans) {
    if (!loan || typeof loan.id !== 'string' || loanIds.has(loan.id) || !ids.has(loan.objectId) || typeof loan.borrower !== 'string' || !loan.borrower.trim() || !Number.isFinite(Date.parse(loan.loanedAt)) || (loan.returnedAt !== null && !Number.isFinite(Date.parse(loan.returnedAt))) || (loan.returnedAt === null && active.has(loan.objectId)))
      throw Error('Le carnet contient un prêt incohérent. Aucune donnée remplacée.');
    loanIds.add(loan.id); if (loan.returnedAt === null) active.add(loan.objectId);
  }
  return structuredClone(value);
}

export function currentLoan(data, objectId) {
  return data.loans.find(loan => loan.objectId === objectId && loan.returnedAt === null);
}

export function addObject(data, { id, label, number }, time) {
  const name = label.trim(), code = number.trim();
  if (!name || name.length > 100 || !code || code.length > 40) throw Error('Indiquez un libellé et un numéro valides.');
  if (data.objects.some(object => object.number.toLocaleLowerCase('fr') === code.toLocaleLowerCase('fr')))
    throw Error('Ce numéro existe déjà. Donnez un numéro différent à cet exemplaire.');
  data.objects.push({ id, label: name, number: code, createdAt: time });
}

export function lendObject(data, { id, objectId, borrower }, time) {
  if (!data.objects.some(object => object.id === objectId)) throw Error('Cet objet n’existe plus.');
  if (currentLoan(data, objectId)) throw Error('Cet exemplaire est déjà en prêt. Sa situation a pu changer dans un autre onglet.');
  if (!borrower.trim() || borrower.trim().length > 100) throw Error('Indiquez le prénom de la personne.');
  data.loans.push({ id, objectId, borrower: borrower.trim(), loanedAt: time, returnedAt: null });
}

export function returnObject(data, { loanId }, time) {
  const loan = data.loans.find(entry => entry.id === loanId);
  if (!loan || loan.returnedAt !== null) throw Error('Ce prêt est déjà terminé ou absent.');
  loan.returnedAt = time;
}
